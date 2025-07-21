// =================================================================
// SCRIPT PRINCIPAL DO BET BABY - VERSÃO SEM EMOJIS
// =================================================================

const GOOGLE_SHEETS_URL = CONFIG.GOOGLE_SHEETS_URL;
let bets = [];

// --- FUNÇÕES DE COMUNICAÇÃO COM API ---

async function sendToGoogleSheets(betData) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            redirect: "follow",
            method: 'POST',
            body: JSON.stringify(betData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const result = await response.json();
        if (result.result === 'success') return true;
        console.error('Erro retornado pelo script do Google:', result.error);
        return false;
    } catch (error) {
        console.error('Erro de conexão ao enviar dados:', error);
        return false;
    }
}

async function loadFromGoogleSheets() {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL + '?action=get');
        if (response.ok) {
            const data = await response.json();
            bets = data || [];
            displayBets();
            updateStats();
            console.log('Dados carregados com sucesso!');
        } else {
            console.error('Falha ao carregar dados. Status:', response.status);
        }
    } catch (error) {
        console.error('Erro de conexão ao carregar dados:', error);
    }
}

// --- FUNÇÕES DE FORMATAÇÃO E UTILIDADE ---

function formatWeight(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 1) {
        value = value.charAt(0) + '.' + value.substring(1);
    }
    input.value = value;
}

function setDynamicDateLimits() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
}

function formatDate(dateStr) {
    if (!dateStr) return 'Data Inválida';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Data Inválida';
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR');
}

function formatTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return '';
    return timeStr.substring(0, 5);
}

// --- FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE ---

function updateStats() {
    const totalBets = bets.length;
    document.getElementById('totalBets').textContent = totalBets;

    if (totalBets === 0) {
        document.getElementById('avgWeight').textContent = '0 kg';
        document.getElementById('avgHeight').textContent = '0 cm';
        return;
    }
    const totalWeight = bets.reduce((sum, bet) => sum + parseFloat(bet.weight || 0), 0);
    const totalHeight = bets.reduce((sum, bet) => sum + parseInt(bet.height || 0), 0);
    const avgWeight = (totalWeight / totalBets).toFixed(1);
    const avgHeight = Math.round(totalHeight / totalBets);
    document.getElementById('avgWeight').textContent = `${avgWeight} kg`;
    document.getElementById('avgHeight').textContent = `${avgHeight} cm`;
}

function displayBets() {
    const betsList = document.getElementById('betsList');
    if (!bets || bets.length === 0) {
        betsList.innerHTML = `<div class="bet-item"><div class="bet-name">Nenhuma aposta ainda</div><div class="bet-details">Seja o primeiro a fazer uma aposta!</div></div>`;
        return;
    }
    bets.sort((a, b) => new Date(a.date) - new Date(b.date));
    betsList.innerHTML = bets.map(bet => {
        // Formata a hora a partir do objeto Date que vem do Google
        const timeObj = new Date(bet.time);
        const formattedTime = !isNaN(timeObj.getTime()) ? timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hora Inválida';

        return `
        <div class="bet-item">
            <div class="bet-name">${bet.name || 'Anônimo'}</div>
            <div class="bet-details">
                Data: ${formatDate(bet.date)} às ${formattedTime} | 
                Peso: ${bet.weight || 'N/A'}kg | 
                Altura: ${bet.height || 'N/A'}cm
            </div>
        </div>
    `}).join('');
}

// --- EVENT LISTENERS E INICIALIZAÇÃO ---

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
        await loadFromGoogleSheets();
        document.getElementById('betForm').reset();
        submitBtn.textContent = 'Aposta Enviada!';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    } else {
        submitBtn.textContent = 'Erro ao Enviar';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 3000);
    }
});

// Inicialização da página
setDynamicDateLimits();
loadFromGoogleSheets();
