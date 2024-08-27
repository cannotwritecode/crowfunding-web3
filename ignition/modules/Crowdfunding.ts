import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const CrowdfundingModule = buildModule('CrowdfundingModule', (m) => {
  // Deploy the Crowdfunding contract
  const crowdfunding = m.contract('Crowdfunding')

  // Return the deployed contract
  return { crowdfunding }
})

export default CrowdfundingModule
