// Configuração do Google Sheets
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyamznAjWjvJtz96hUJQ2cjKAYTTtQUbMLb2CDkJhIJAuTKEMI3EvdFppOnxBbQEETq/exec';

// Carregar apostas do localStorage (backup local) ou inicializar array vazio
let bets = JSON.parse(localStorage.getItem('betBabyData')) || [];

// Função para enviar dados para Google Sheets
async function sendToGoogleSheets(betData) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(betData)
        });
        
        if (response.ok) {
            console.log('Dados enviados com sucesso para Google Sheets!');
            return true;
        } else {
            console.error('Erro ao enviar para Google Sheets');
            return false;
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        return false;
    }
}

// Função para carregar dados do Google Sheets
async function loadFromGoogleSheets() {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL + '?action=get');
        if (response.ok) {
            const data = await response.json();
            bets = data || [];
            displayBets();
            updateStats();
            console.log('Dados carregados do Google Sheets!');
        } else {
            console.error('Erro ao carregar dados do Google Sheets');
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Função para salvar dados no localStorage
function saveBetsToStorage() {
    localStorage.setItem('betBabyData', JSON.stringify(bets));
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

function formatTime(timeStr) {
    return timeStr;
}

function updateStats() {
    const totalBets = bets.length;
    document.getElementById('totalBets').textContent = totalBets;

    if (totalBets === 0) {
        document.getElementById('avgWeight').textContent = '0 kg';
        document.getElementById('avgHeight').textContent = '0 cm';
        return;
    }

    const avgWeight = (bets.reduce((sum, bet) => sum + parseFloat(bet.weight), 0) / totalBets).toFixed(1);
    const avgHeight = Math.round(bets.reduce((sum, bet) => sum + parseInt(bet.height), 0) / totalBets);
    
    document.getElementById('avgWeight').textContent = avgWeight + ' kg';
    document.getElementById('avgHeight').textContent = avgHeight + ' cm';
}

function displayBets() {
    const betsList = document.getElementById('betsList');
    
    if (bets.length === 0) {
        betsList.innerHTML = `
            <div class="bet-item">
                <div class="bet-name">📝 Ainda não há apostas</div>
                <div class="bet-details">Seja o primeiro a fazer uma aposta!</div>
            </div>
        `;
        return;
    }

    betsList.innerHTML = bets.map(bet => `
        <div class="bet-item">
            <div class="bet-name">${bet.name}</div>
            <div class="bet-details">
                📅 ${formatDate(bet.date)} às ${formatTime(bet.time)} | 
                ⚖️ ${bet.weight}kg | 
                📏 ${bet.height}cm
            </div>
        </div>
    `).join('');
}

// Event listener para o formulário
document.getElementById('betForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '📤 Enviando...';
    submitBtn.disabled = true;
    
    const name = document.getElementById('name').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;

    const newBet = {
        id: Date.now(),
        name,
        date,
        time,
        weight,
        height,
        timestamp: new Date().toISOString()
    };

    // Tentar enviar para Google Sheets
    const success = await sendToGoogleSheets(newBet);
    
    if (success) {
        // Adicionar localmente também
        bets.push(newBet);
        saveBetsToStorage();
        
        // Ordenar apostas por data
        bets.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
        
        displayBets();
        updateStats();
        
        // Limpar formulário
        document.getElementById('betForm').reset();
        
        // Feedback de sucesso
        submitBtn.textContent = '✅ Aposta Enviada!';
        submitBtn.style.background = '#4CAF50';
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            submitBtn.disabled = false;
        }, 2000);
    } else {
        // Feedback de erro
        submitBtn.textContent = '❌ Erro ao Enviar';
        submitBtn.style.background = '#f44336';
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            submitBtn.disabled = false;
        }, 2000);
    }
});

// Inicializar - carregar dados do Google Sheets
loadFromGoogleSheets();
