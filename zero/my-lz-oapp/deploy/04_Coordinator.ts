import assert from 'assert'
import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'Coordinator'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    // Only deploy Coordinator on Sepolia
    if (hre.network.name !== 'sepolia') {
        console.log(`Skipping Coordinator deployment on ${hre.network.name} (only deploys on Sepolia)`)
        return
    }

    // Get required deployments
    const endpointV2Deployment = await hre.deployments.get('EndpointV2')
    const walletFactoryDeployment = await deployments.get('WalletFactory')

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [
            endpointV2Deployment.address, // LayerZero's EndpointV2 address
            deployer, // owner
            walletFactoryDeployment.address, // WalletFactory address
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`)
}

deploy.tags = [contractName]
deploy.dependencies = ['WalletFactory']

export default deploy
