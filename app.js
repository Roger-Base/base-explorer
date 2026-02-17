// Base Explorer - Simple Lookup Tool

const BASE_RPC = 'https://mainnet.base.org';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchBtn').addEventListener('click', search);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') search();
    });
});

async function search() {
    const input = document.getElementById('searchInput').value.trim();
    const resultBox = document.getElementById('result');
    const errorBox = document.getElementById('error');
    
    // Hide previous results
    resultBox.classList.add('hidden');
    errorBox.classList.add('hidden');
    
    if (!input) {
        showError('Please enter an address or transaction hash');
        return;
    }
    
    // Determine if tx or address
    const isTx = input.startsWith('0x') && input.length === 66;
    const isAddress = input.startsWith('0x') && input.length === 42;
    
    if (!isTx && !isAddress) {
        showError('Invalid format. Use 0x... (42 chars for address, 66 for tx)');
        return;
    }
    
    try {
        if (isTx) {
            await getTransaction(input);
        } else {
            await getAddressInfo(input);
        }
        resultBox.classList.remove('hidden');
    } catch (e) {
        showError(e.message);
    }
}

async function getTransaction(txHash) {
    const response = await fetch(BASE_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionByHash',
            params: [txHash],
            id: 1
        })
    });
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }
    
    const tx = data.result;
    
    if (!tx) {
        throw new Error('Transaction not found');
    }
    
    // Convert values
    const valueEth = parseInt(tx.value, 16) / 1e18;
    const gasUsed = tx.gas ? parseInt(tx.gas, 16) : 'N/A';
    
    document.getElementById('type').textContent = 'Transaction';
    document.getElementById('hash').textContent = tx.hash;
    document.getElementById('block').textContent = tx.blockNumber ? parseInt(tx.blockNumber, 16) : 'Pending';
    document.getElementById('from').textContent = tx.from;
    document.getElementById('to').textContent = tx.to || 'Contract Creation';
    document.getElementById('value').textContent = valueEth.toFixed(6) + ' ETH';
    document.getElementById('gas').textContent = gasUsed;
}

async function getAddressInfo(address) {
    // Get balance
    const balanceResponse = await fetch(BASE_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1
        })
    });
    
    const balanceData = await balanceResponse.json();
    const balanceEth = balanceData.result ? parseInt(balanceData.result, 16) / 1e18 : 0;
    
    // Get transaction count
    const countResponse = await fetch(BASE_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionCount',
            params: [address, 'latest'],
            id: 1
        })
    });
    
    const countData = await countResponse.json();
    const txCount = countData.result ? parseInt(countData.result, 16) : 0;
    
    // Get code (to check if contract)
    const codeResponse = await fetch(BASE_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getCode',
            params: [address, 'latest'],
            id: 1
        })
    });
    
    const codeData = await codeResponse.json();
    const isContract = codeData.result && codeData.result !== '0x';
    
    document.getElementById('type').textContent = isContract ? 'Contract' : 'EOA (Wallet)';
    document.getElementById('hash').textContent = address;
    document.getElementById('block').textContent = 'N/A';
    document.getElementById('from').textContent = 'N/A';
    document.getElementById('to').textContent = 'N/A';
    document.getElementById('value').textContent = balanceEth.toFixed(6) + ' ETH';
    document.getElementById('gas').textContent = txCount + ' txs';
}

function showError(msg) {
    const errorBox = document.getElementById('error');
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
}
