import assert from 'assert'
import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'WalletFactory'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    // Get SessionModule deployment
    const sessionModuleDeployment = await deployments.get('SessionModule')

    const { address } = await deploy(contractName, {
        from: deployer,
        args: [
            sessionModuleDeployment.address, // SessionModule address
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`)
}

deploy.tags = [contractName]
deploy.dependencies = ['SessionModule']

export default deploy
