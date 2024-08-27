import React, { useState } from 'react'
import { ethers } from 'ethers'

import contractABI from './assets/abi.json'

const App: React.FC = () => {
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState(0)
  const [campaignId, setCampaignId] = useState(0)
  const [contributionAmount, setContributionAmount] = useState('')
  const [message, setMessage] = useState('')

  // Replace with your contract's address and ABI
  const contractAddress = '0x41331Addc6F65C83d4f6cb53a608AF590c81f1Bc'

  // Create a contract instance
  const getContract = async () => {
    let signer = null

    let provider
    if (window.ethereum == null) {
      console.log('MetaMask not installed; using read-only defaults')
      provider = ethers.getDefaultProvider()
    } else {
      provider = new ethers.BrowserProvider(window.ethereum)
      signer = await provider.getSigner()
    }
    const contract = new ethers.Contract(contractAddress, contractABI, signer)
    return contract
  }

  // Function to create a campaign
  const createCampaign = async () => {
    try {
      const contract = await getContract()
      const tx = await contract.createCampaign(
        ethers.parseEther(goal),
        duration
      )
      await tx.wait()
      setMessage('Campaign created successfully!')
    } catch (error) {
      console.error('Error creating campaign:', error)
      setMessage('Failed to create campaign.')
    }
  }

  // Function to contribute to a campaign
  const contribute = async () => {
    try {
      const contract = await getContract()
      const tx = await contract.contribute(campaignId, {
        value: ethers.parseEther(contributionAmount),
      })
      await tx.wait()
      setMessage('Contribution made successfully!')
    } catch (error) {
      console.error('Error contributing:', error)
      setMessage('Failed to contribute.')
    }
  }

  // Function to withdraw funds from a campaign
  const withdrawFunds = async () => {
    try {
      const contract = await getContract()
      const tx = await contract.withdrawCampaignFunds(campaignId)
      await tx.wait()
      setMessage('Funds withdrawn successfully!')
    } catch (error) {
      console.error('Error withdrawing funds:', error)
      setMessage('Failed to withdraw funds.')
    }
  }

  // Function to refund a contribution
  const refundContribution = async () => {
    try {
      const contract = await getContract()
      const tx = await contract.RefundContribution(campaignId)
      await tx.wait()
      setMessage('Contribution refunded successfully!')
    } catch (error) {
      console.error('Error refunding contribution:', error)
      setMessage('Failed to refund contribution.')
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Crowdfunding DApp</h1>

      {/* Create Campaign */}
      <h2>Create Campaign</h2>
      <input
        type="text"
        placeholder="Goal in ETH"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />
      <input
        type="number"
        placeholder="Duration in days"
        value={duration}
        onChange={(e) => setDuration(parseInt(e.target.value))}
      />
      <button onClick={createCampaign}>Create Campaign</button>

      {/* Contribute to Campaign */}
      <h2>Contribute to Campaign</h2>
      <input
        type="number"
        placeholder="Campaign ID"
        value={campaignId}
        onChange={(e) => setCampaignId(parseInt(e.target.value))}
      />
      <input
        type="text"
        placeholder="Contribution amount in ETH"
        value={contributionAmount}
        onChange={(e) => setContributionAmount(e.target.value)}
      />
      <button onClick={contribute}>Contribute</button>

      {/* Withdraw Funds */}
      <h2>Withdraw Funds</h2>
      <input
        type="number"
        placeholder="Campaign ID"
        value={campaignId}
        onChange={(e) => setCampaignId(parseInt(e.target.value))}
      />
      <button onClick={withdrawFunds}>Withdraw Funds</button>

      {/* Refund Contribution */}
      <h2>Refund Contribution</h2>
      <input
        type="number"
        placeholder="Campaign ID"
        value={campaignId}
        onChange={(e) => setCampaignId(parseInt(e.target.value))}
      />
      <button onClick={refundContribution}>Refund Contribution</button>

      {/* Display Message */}
      {message && <p>{message}</p>}
    </div>
  )
}

export default App
