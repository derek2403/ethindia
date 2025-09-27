import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'

import { Options } from '@layerzerolabs/lz-v2-utilities'

describe('Session Management System Test', function () {
    // Mock Endpoint IDs
    const sepoliaEid = 40161
    const hederaEid = 40230
    const flowEid = 40231

    // Contract factories
    let SessionModule: ContractFactory
    let WalletFactory: ContractFactory
    let MinimalWallet: ContractFactory
    let Escrow: ContractFactory
    let Coordinator: ContractFactory
    let Installer: ContractFactory
    let EndpointV2Mock: ContractFactory

    // Signers
    let user: SignerWithAddress
    let sessionSigner: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let deployer: SignerWithAddress

    // Contract instances
    let sessionModule: Contract
    let walletFactory: Contract
    let escrowSepolia: Contract
    let escrowHedera: Contract
    let escrowFlow: Contract
    let coordinator: Contract
    let installerHedera: Contract
    let installerFlow: Contract
    let mockEndpointSepolia: Contract
    let mockEndpointHedera: Contract
    let mockEndpointFlow: Contract

    before(async function () {
        // Get contract factories
        SessionModule = await ethers.getContractFactory('SessionModule')
        WalletFactory = await ethers.getContractFactory('WalletFactory')
        MinimalWallet = await ethers.getContractFactory('MinimalWallet')
        Escrow = await ethers.getContractFactory('Escrow')
        Coordinator = await ethers.getContractFactory('Coordinator')
        Installer = await ethers.getContractFactory('Installer')

        // Get signers
        const signers = await ethers.getSigners()
        ;[user, sessionSigner, endpointOwner, deployer] = signers

        // Get EndpointV2Mock factory
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        EndpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)
    })

    beforeEach(async function () {
        // Deploy mock endpoints
        mockEndpointSepolia = await EndpointV2Mock.deploy(sepoliaEid)
        mockEndpointHedera = await EndpointV2Mock.deploy(hederaEid)
        mockEndpointFlow = await EndpointV2Mock.deploy(flowEid)

        // Deploy core contracts
        sessionModule = await SessionModule.deploy()
        walletFactory = await WalletFactory.deploy(sessionModule.address)

        // Deploy escrow contracts for each chain
        escrowSepolia = await Escrow.connect(deployer).deploy()
        escrowHedera = await Escrow.connect(deployer).deploy()
        escrowFlow = await Escrow.connect(deployer).deploy()

        // Deploy coordinator (Sepolia)
        coordinator = await Coordinator.deploy(
            mockEndpointSepolia.address,
            deployer.address,
            walletFactory.address
        )

        // Deploy installers (Hedera and Flow)
        installerHedera = await Installer.deploy(
            mockEndpointHedera.address,
            deployer.address,
            walletFactory.address
        )

        installerFlow = await Installer.deploy(
            mockEndpointFlow.address,
            deployer.address,
            walletFactory.address
        )

        // Set up cross-chain connections
        await mockEndpointSepolia.setDestLzEndpoint(installerHedera.address, mockEndpointHedera.address)
        await mockEndpointSepolia.setDestLzEndpoint(installerFlow.address, mockEndpointFlow.address)
        await mockEndpointHedera.setDestLzEndpoint(coordinator.address, mockEndpointSepolia.address)
        await mockEndpointFlow.setDestLzEndpoint(coordinator.address, mockEndpointSepolia.address)

        // Set peers
        await coordinator.connect(deployer).setPeer(hederaEid, ethers.utils.zeroPad(installerHedera.address, 32))
        await coordinator.connect(deployer).setPeer(flowEid, ethers.utils.zeroPad(installerFlow.address, 32))
        await installerHedera.connect(deployer).setPeer(sepoliaEid, ethers.utils.zeroPad(coordinator.address, 32))
        await installerFlow.connect(deployer).setPeer(sepoliaEid, ethers.utils.zeroPad(coordinator.address, 32))
    })

    describe('SessionModule', function () {
        it('should install a session with proper policies', async function () {
            // Create a minimal wallet for testing
            const salt = await walletFactory.generateSalt(user.address, 1)
            const walletAddress = await walletFactory.getWalletAddress(user.address, salt)
            await walletFactory.deployIfNeeded(user.address, salt)
            
            const wallet = await ethers.getContractAt('MinimalWallet', walletAddress)

            // Prepare session installation data
            const sessionPubKey = sessionSigner.address
            const expiry = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
            
            const tokenLimits = [
                { token: ethers.constants.AddressZero, limit: ethers.utils.parseEther('10') }
            ]
            
            const escrowPermissions = [
                { escrow: escrowSepolia.address, allowed: true }
            ]

            // Install session (called by wallet owner)
            await wallet.connect(user).installSession(
                sessionPubKey,
                expiry,
                tokenLimits,
                escrowPermissions
            )

            // Verify session was installed
            const session = await sessionModule.getSession(walletAddress)
            expect(session.sessionPubKey).to.equal(sessionPubKey)
            expect(session.expiry).to.equal(expiry)
            expect(session.isActive).to.be.true

            // Verify token limit
            const tokenLimit = await sessionModule.getTokenLimit(walletAddress, ethers.constants.AddressZero)
            expect(tokenLimit).to.equal(ethers.utils.parseEther('10'))

            // Verify escrow permission
            const isAllowed = await sessionModule.isEscrowAllowed(walletAddress, escrowSepolia.address)
            expect(isAllowed).to.be.true
        })

        it('should reject session execution with invalid signature', async function () {
            // Create and deploy wallet
            const salt = await walletFactory.generateSalt(user.address, 1)
            const walletAddress = await walletFactory.getWalletAddress(user.address, salt)
            await walletFactory.deployIfNeeded(user.address, salt)
            
            const wallet = await ethers.getContractAt('MinimalWallet', walletAddress)

            // Install session
            const sessionPubKey = sessionSigner.address
            const expiry = Math.floor(Date.now() / 1000) + 3600
            
            await wallet.connect(user).installSession(
                sessionPubKey,
                expiry,
                [{ token: ethers.constants.AddressZero, limit: ethers.utils.parseEther('10') }],
                [{ escrow: escrowSepolia.address, allowed: true }]
            )

            // Try to execute with invalid signature
            const invalidSignature = '0x' + '0'.repeat(130)
            
            await expect(
                sessionModule.verifyAndExecute(
                    walletAddress,
                    escrowSepolia.address,
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther('1'),
                    '0x',
                    invalidSignature
                )
            ).to.be.revertedWith('InvalidSignature')
        })
    })

    describe('WalletFactory', function () {
        it('should create deterministic wallet addresses', async function () {
            const salt = await walletFactory.generateSalt(user.address, 1)
            const predictedAddress = await walletFactory.getWalletAddress(user.address, salt)
            
            // Deploy wallet
            const deployedAddress = await walletFactory.deployIfNeeded(user.address, salt)
            
            expect(deployedAddress).to.equal(predictedAddress)
            
            // Verify wallet is marked as deployed
            const isWallet = await walletFactory.isWallet(deployedAddress)
            expect(isWallet).to.be.true
        })

        it('should not redeploy existing wallet', async function () {
            const salt = await walletFactory.generateSalt(user.address, 1)
            
            // Deploy first time
            const firstAddress = await walletFactory.deployIfNeeded(user.address, salt)
            
            // Try to deploy again
            const secondAddress = await walletFactory.deployIfNeeded(user.address, salt)
            
            expect(firstAddress).to.equal(secondAddress)
        })
    })

    describe('Escrow', function () {
        it('should accept native deposits', async function () {
            const depositAmount = ethers.utils.parseEther('1')
            
            await escrowSepolia.connect(user).depositNative({ value: depositAmount })
            
            const userBalance = await escrowSepolia.getUserBalance(user.address, ethers.constants.AddressZero)
            expect(userBalance).to.equal(depositAmount)
        })

        it('should accept ERC20 deposits', async function () {
            // Create a mock ERC20 token for testing
            const MockERC20 = await ethers.getContractFactory('MockERC20')
            const mockToken = await MockERC20.deploy('Mock Token', 'MOCK', 18)
            
            const depositAmount = ethers.utils.parseEther('100')
            
            // Mint tokens to user and approve escrow
            await mockToken.mint(user.address, depositAmount)
            await mockToken.connect(user).approve(escrowSepolia.address, depositAmount)
            
            await escrowSepolia.connect(user).depositERC20(mockToken.address, depositAmount)
            
            const userBalance = await escrowSepolia.getUserBalance(user.address, mockToken.address)
            expect(userBalance).to.equal(depositAmount)
        })
    })

    describe('Cross-chain Session Installation', function () {
        it('should quote session installation fees correctly', async function () {
            const sessionPubKey = sessionSigner.address
            const expiry = Math.floor(Date.now() / 1000) + 3600
            
            const sessionIntent = {
                user: user.address,
                sessionPubKey: sessionPubKey,
                expiry: expiry,
                nonce: 0,
                destinations: [
                    { chainEid: hederaEid, escrowAddr: escrowHedera.address },
                    { chainEid: flowEid, escrowAddr: escrowFlow.address }
                ],
                tokenPolicies: [
                    { token: ethers.constants.AddressZero, limit: ethers.utils.parseEther('10') }
                ]
            }

            const options = ['0x', '0x'] // Empty options for both destinations

            const messagingFee = await coordinator.quoteInstallSessions(sessionIntent, options, false)
            
            expect(messagingFee.nativeFee).to.be.gt(0)
            expect(messagingFee.lzTokenFee).to.equal(0) // Not paying in LZ token
        })

        it('should handle cross-chain message reception', async function () {
            // Prepare session installation message
            const sessionPubKey = sessionSigner.address
            const expiry = Math.floor(Date.now() / 1000) + 3600
            
            const destinations = [
                { chainEid: hederaEid, escrowAddr: escrowHedera.address }
            ]
            
            const tokenPolicies = [
                { token: ethers.constants.AddressZero, limit: ethers.utils.parseEther('10') }
            ]

            const message = ethers.utils.defaultAbiCoder.encode(
                ['address', 'address', 'uint256', 'tuple(uint32,address)[]', 'tuple(address,uint256)[]'],
                [user.address, sessionPubKey, expiry, destinations, tokenPolicies]
            )

            // Simulate message reception on Hedera installer
            const options = Options.newOptions().addExecutorLzReceiveOption(250000, 0).toHex().toString()
            
            // This would normally be triggered by LayerZero, but we'll call it directly for testing
            await expect(
                mockEndpointHedera.lzReceive(
                    installerHedera.address,
                    sepoliaEid,
                    ethers.utils.zeroPad(coordinator.address, 32),
                    1, // nonce
                    1000000, // gas limit
                    message
                )
            ).to.emit(installerHedera, 'SessionInstalled')
        })
    })

    describe('Integration Test', function () {
        it('should complete full session installation and execution flow', async function () {
            // 1. Generate wallet for user
            const salt = await walletFactory.generateSalt(user.address, 1)
            const walletAddress = await walletFactory.getWalletAddress(user.address, salt)
            
            // 2. Install session locally (simulating what Coordinator would do)
            await walletFactory.deployIfNeeded(user.address, salt)
            const wallet = await ethers.getContractAt('MinimalWallet', walletAddress)
            
            const sessionPubKey = sessionSigner.address
            const expiry = Math.floor(Date.now() / 1000) + 3600
            
            await wallet.connect(user).installSession(
                sessionPubKey,
                expiry,
                [{ token: ethers.constants.AddressZero, limit: ethers.utils.parseEther('10') }],
                [{ escrow: escrowSepolia.address, allowed: true }]
            )

            // 3. Fund the wallet
            await user.sendTransaction({
                to: walletAddress,
                value: ethers.utils.parseEther('5')
            })

            // 4. Create deposit call data
            const escrowInterface = new ethers.utils.Interface(['function depositNative() payable'])
            const callData = escrowInterface.encodeFunctionData('depositNative', [])

            // 5. Create proper session signature
            const amount = ethers.utils.parseEther('1')
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ['address', 'address', 'address', 'uint256', 'bytes', 'uint256'],
                    [walletAddress, escrowSepolia.address, ethers.constants.AddressZero, amount, callData, 1]
                )
            )
            const ethSignedMessageHash = ethers.utils.hashMessage(ethers.utils.arrayify(messageHash))
            const signature = await sessionSigner.signMessage(ethers.utils.arrayify(messageHash))

            // 6. Execute session transaction
            await wallet.executeAsWallet(
                escrowSepolia.address,
                ethers.constants.AddressZero,
                amount,
                callData,
                signature,
                { value: amount }
            )

            // 7. Verify deposit was recorded
            const userBalance = await escrowSepolia.getUserBalance(walletAddress, ethers.constants.AddressZero)
            expect(userBalance).to.equal(amount)

            // 8. Verify token limit was reduced
            const remainingLimit = await sessionModule.getTokenLimit(walletAddress, ethers.constants.AddressZero)
            expect(remainingLimit).to.equal(ethers.utils.parseEther('9')) // 10 - 1 = 9
        })
    })
})
