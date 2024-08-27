import { expect } from 'chai'
import hre from 'hardhat'

describe('Crowdfunding', function () {
  let Crowdfunding: any
  let crowdfunding: any
  let owner: any
  let addr1: any
  let addr2: any
  let addrs: any[]

  beforeEach(async function () {
    Crowdfunding = await hre.ethers.getContractFactory('Crowdfunding')
    ;[owner, addr1, addr2, ...addrs] = await hre.ethers.getSigners()
    crowdfunding = await Crowdfunding.deploy()
  })

  describe('Deployment', function () {
    it('Should deploy the contract and initialize correctly', async function () {
      const campaigns = await crowdfunding.campaigns // Adjust based on your contract
      expect(campaigns.length).to.equal(0)
    })
  })

  describe('Creating Campaigns', function () {
    it('Should create a new campaign', async function () {
      await crowdfunding.createCampaign(hre.ethers.parseEther('10'), 30)
      const campaign = await crowdfunding.campaigns(0) // Ensure this function is defined in your contract
      expect(campaign.creator).to.equal(await owner.getAddress())
      expect(campaign.goal).to.equal(hre.ethers.parseEther('10'))
      expect(campaign.deadline).to.be.above(0)
      expect(campaign.amountCollected).to.equal(0)
      expect(campaign.goalReached).to.equal(false)
      expect(campaign.fundsWithdrawn).to.equal(false)
    })
  })

  describe('Contributing to Campaigns', function () {
    beforeEach(async function () {
      await crowdfunding.createCampaign(hre.ethers.parseEther('10'), 30)
    })

    it('Should allow contributions to a campaign', async function () {
      await crowdfunding
        .connect(addr1)
        .contribute(0, { value: hre.ethers.parseEther('1') })
      const campaign = await crowdfunding.campaigns(0)
      expect(campaign.amountCollected).to.equal(hre.ethers.parseEther('1'))
      const contribution = await crowdfunding.contributions(
        0,
        await addr1.getAddress()
      )
      expect(contribution).to.equal(hre.ethers.parseEther('1'))
    })

    it('Should emit ContributionMade event', async function () {
      await expect(
        crowdfunding
          .connect(addr1)
          .contribute(0, { value: hre.ethers.parseEther('1') })
      )
        .to.emit(crowdfunding, 'ContributionMade')
        .withArgs(0, await addr1.getAddress(), hre.ethers.parseEther('1'))
    })
  })

  describe('Withdrawing Funds', function () {
    beforeEach(async function () {
      await crowdfunding.createCampaign(hre.ethers.parseEther('10'), 1)
      await crowdfunding
        .connect(addr1)
        .contribute(0, { value: hre.ethers.parseEther('10') })
      await hre.ethers.provider.send('evm_increaseTime', [86400]) // Increase time by 1 day
      await hre.ethers.provider.send('evm_mine')
    })

    it('Should allow the creator to withdraw funds after the campaign ends', async function () {
      await expect(crowdfunding.withdrawCampaignFunds(0))
        .to.emit(crowdfunding, 'FundsWithdrawn')
        .withArgs(0, await owner.getAddress(), hre.ethers.parseEther('10'))
      const campaign = await crowdfunding.campaigns(0)
      expect(campaign.fundsWithdrawn).to.equal(true)
      expect(campaign.amountCollected).to.equal(0)
    })

    it('Should not allow non-creators to withdraw funds', async function () {
      await expect(
        crowdfunding.connect(addr1).withdrawCampaignFunds(0)
      ).to.be.revertedWith(
        'Only the creator of this campaign can withdraw the Funds'
      )
    })
  })

  describe('Refunding Contributions', function () {
    beforeEach(async function () {
      await crowdfunding.createCampaign(hre.ethers.parseEther('10'), 1)
      await crowdfunding
        .connect(addr1)
        .contribute(0, { value: hre.ethers.parseEther('1') })
      await hre.ethers.provider.send('evm_increaseTime', [86400]) // Increase time by 1 day
      await hre.ethers.provider.send('evm_mine')
    })

    it('Should allow contributors to get a refund if the campaign fails', async function () {
      await expect(crowdfunding.connect(addr1).refundContribution(0)) // Ensure function name matches
        .to.emit(crowdfunding, 'RefundClaimed')
        .withArgs(0, await addr1.getAddress(), hre.ethers.parseEther('1'))
      const contribution = await crowdfunding.contributions(
        0,
        await addr1.getAddress()
      )
      expect(contribution).to.equal(0)
    })

    it('Should not allow refunds before the campaign ends', async function () {
      await crowdfunding.createCampaign(hre.ethers.parseEther('10'), 30)
      await crowdfunding
        .connect(addr1)
        .contribute(1, { value: hre.ethers.parseEther('1') })
      await expect(
        crowdfunding.connect(addr1).refundContribution(1)
      ).to.be.revertedWith('Campaign not ended yet.')
    })
  })
})
