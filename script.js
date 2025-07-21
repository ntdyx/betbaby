// =================================================================
// SCRIPT PRINCIPAL DO BET BABY
// =================================================================

// Lê a URL do arquivo de configuração
const GOOGLE_SHEETS_URL = CONFIG.https://script.google.com/macros/s/AKfycbzxRn1NwT2mpTcQ5U7D7XFP4vex_qP7KCkWevEanTsnR8KtsmChyC-ISxea29p4DzVx/exec;

// Variável para armazenar as apostas localmente
let bets = [];

/**
 * Envia uma nova aposta para a planilha do Google Sheets.
 * Usa a configuração de 'text/plain' para evitar o erro de CORS.
 * @param {object} betData - O objeto contendo os dados da aposta.
 * @returns {Promise<boolean>} - True se o envio for bem-sucedido, false caso contrário.
 */
async function sendToGoogleSheets(betData) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            redirect: "follow",
            method: 'POST',
            body: JSON.stringify(betData),
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            }
        });

        const resultText = await response.text();
        const result = JSON.parse(resultText);
        
        if (result.result === 'success') {
            console.log('Dados enviados com sucesso para Google Sheets!');
            return true;
        } else {
            console.error('Erro retornado pelo script do Google:', result.error);
            return false;
        }
    } catch (error) {
        console.error('Erro de conexão ao enviar dados:', error);
        return false;
    }
}

/**
 * Carrega todas as apostas da planilha do Google Sheets.
 */
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
            console.error('Falha ao carregar dados do Google Sheets. Status:', response.status);
        }
    } catch (error) {
        console.error('Erro de conexão ao carregar dados:', error);
    }
}

/**
 * Formata a data para o padrão pt-BR e corrige o bug de fuso horário.
 * @param {string} dateStr - A data no formato 'YYYY-MM-DD'.
 * @returns {string} - A data formatada como 'DD/MM/YYYY'.
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Data Inválida';
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR');
}

/**
 * Retorna a string de tempo como ela é.
 * @param {string} timeStr - A hora no formato 'HH:MM'.
 * @returns {string} - A hora.
 */
function formatTime(timeStr) {
    return timeStr || '';
}

/**
 * Atualiza as estatísticas (Total, Peso Médio, Altura Média).
 */
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

/**
 * Renderiza a lista de apostas na página.
 */
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

    bets.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

    betsList.innerHTML = bets.map(bet => `
        <div class="bet-item">
            <div class="bet-name">${bet.name || 'Anônimo'}</div>
            <div class="bet-details">
                📅 ${formatDate(bet.date)} às ${formatTime(bet.time)} | 
                ⚖️ ${bet.weight || 'N/A'}kg | 
                📏 ${bet.height || 'N/A'}cm
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
