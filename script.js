// =================================================================
// SCRIPT.JS - VERSÃO FINAL COM VALIDAÇÃO FRONTAL
// =================================================================
const GOOGLE_SHEETS_URL = CONFIG.https://script.google.com/macros/s/AKfycbzxRn1NwT2mpTcQ5U7D7XFP4vex_qP7KCkWevEanTsnR8KtsmChyC-ISxea29p4DzVx/exec;
let bets = [];

// ... as funções sendToGoogleSheets e loadFromGoogleSheets não mudam ...
async function sendToGoogleSheets(betData) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
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
function formatTime(timeInput) {
    if (timeInput instanceof Date) {
        return timeInput.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (typeof timeInput === 'string') { return timeInput; }
    return 'Hora Inválida';
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
        betsList.innerHTML = `<div class="bet-item"><p>Nenhuma aposta ainda. Seja o primeiro!</p></div>`;
        return;
    }
    bets.sort((a, b) => new Date(a.date) - new Date(b.date));
    betsList.innerHTML = bets.map(bet => {
        const timeObj = new Date(bet.time);
        const formattedTime = !isNaN(timeObj.getTime()) ? timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : formatTime(bet.time);
        return `<div class="bet-item"><p><strong>${bet.name || 'Alguém'}</strong> apostou que Ana vai nascer em <strong>${formatDate(bet.date)}</strong> às <strong>${formattedTime}</strong>, pesando <strong>${bet.weight || 'N/A'}kg</strong> e medindo <strong>${bet.height || 'N/A'}cm</strong>.</p></div>`
    }).join('');
}

// --- EVENT LISTENERS E INICIALIZAÇÃO ---
document.getElementById('betForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    // --- NOVA VALIDAÇÃO ---
    const weightInput = document.getElementById('weight').value;
    // Substitui vírgula por ponto para consistência
    const correctedWeight = weightInput.replace(',', '.');
    // Verifica se o resultado é um número válido
    if (isNaN(parseFloat(correctedWeight))) {
        alert("Por favor, insira um valor de peso válido (ex: 3.2).");
        return; // Para a execução se o peso for inválido
    }
    // --- FIM DA VALIDAÇÃO ---

    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    const newBet = {
        name: document.getElementById('name').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        weight: correctedWeight, // Usa o valor corrigido
        height: document.getElementById('height').value,
        timestamp: new Date().toISOString()
    };

    const success = await sendToGoogleSheets(newBet);
    if (success) {
        await loadFromGoogleSheets();
        document.getElementById('betForm').reset();
        submitBtn.textContent = 'Aposta Enviada!';
        setTimeout(() => { submitBtn.textContent = originalText; submitBtn.disabled = false; }, 2000);
    } else {
        alert('Ocorreu um erro ao enviar sua aposta. Verifique os dados e tente novamente.');
        submitBtn.textContent = 'Erro ao Enviar';
        setTimeout(() => { submitBtn.textContent = originalText; submitBtn.disabled = false; }, 3000);
    }
});

// Inicialização da página
setDynamicDateLimits();
loadFromGoogleSheets();
