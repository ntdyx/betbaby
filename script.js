// USA A URL DEFINIDA NO ARQUIVO config.js
const GOOGLE_SHEETS_URL = CONFIG.https://script.google.com/macros/s/AKfycbzxRn1NwT2mpTcQ5U7D7XFP4vex_qP7KCkWevEanTsnR8KtsmChyC-ISxea29p4DzVx/exec;

let bets = [];

// Função para enviar dados para Google Sheets
async function sendToGoogleSheets(betData) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(betData)
        });

        const result = await response.json();
        
        if (result.result === 'success') {
            console.log('Dados enviados com sucesso para Google Sheets!');
            return true;
        } else {
            console.error('Erro retornado pelo Google Sheets:', result.error);
            return false;
        }
    } catch (error) {
        console.error('Erro de conexão ao enviar:', error);
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
            console.log('Dados carregados do Google Sheets!', data);
        } else {
            console.error('Erro ao carregar dados do Google Sheets');
        }
    } catch (error) {
        console.error('Erro de conexão ao carregar:', error);
    }
}

// Funções de formatação
function formatDate(dateStr) {
    const date = new Date(dateStr);
    // Adiciona o fuso horário para corrigir bug de um dia a menos
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR');
}

function formatTime(timeStr) {
    return timeStr;
}

// Função para atualizar as estatísticas
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

// Função para exibir as apostas na tela
function displayBets() {
    const betsList = document.getElementById('betsList');
    
    if (!bets || bets.length === 0) {
        betsList.innerHTML = `
            <div class="bet-item">
                <div class="bet-name">📝 Nenhuma aposta ainda</div>
                <div class="bet-details">Seja o primeiro a fazer uma aposta!</div>
            </div>
        `;
        return;
    }

    // Ordenar apostas por data
    bets.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

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

// Event listener para o envio do formulário
document.getElementById('betForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    const newBet = {
        name: document.getElementById('name').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        weight: document.getElementById('weight').value,
        height: document.getElementById('height').value,
        timestamp: new Date().toISOString()
    };

    const success = await sendToGoogleSheets(newBet);
    
    if (success) {
        await loadFromGoogleSheets(); // Recarrega os dados para incluir a nova aposta
        document.getElementById('betForm').reset();
        
        submitBtn.textContent = '✅ Aposta Enviada!';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    } else {
        submitBtn.textContent = '❌ Erro ao Enviar';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 3000);
    }
});

// Carrega os dados do Google Sheets assim que a página é aberta
loadFromGoogleSheets();
