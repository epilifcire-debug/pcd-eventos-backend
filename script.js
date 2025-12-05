// ===== SISTEMA DE EVENTOS LOCAL =====
let eventos = JSON.parse(localStorage.getItem('eventos')) || [];

const formEvento = document.getElementById('formEvento');
const listaEventos = document.getElementById('listaEventos');

// === SALVAR EVENTO ===
formEvento.addEventListener('submit', (e) => {
  e.preventDefault();
  const evento = {
    id: Date.now(),
    nome: nomeEvento.value.trim(),
    data: dataEvento.value,
    classificacao: classificacao.value.trim(),
    local: localEvento.value.trim(),
    pagamento: formasPagamento.value.trim(),
    descricao: descricao.value.trim(),
    lotes: []
  };
  eventos.push(evento);
  salvarLocal();
  formEvento.reset();
  renderEventos();
});

function salvarLocal() {
  localStorage.setItem('eventos', JSON.stringify(eventos));
}

// === RENDERIZAÇÃO DOS EVENTOS ===
function renderEventos() {
  listaEventos.innerHTML = '';
  if (eventos.length === 0) {
    listaEventos.innerHTML = '<p>Nenhum evento cadastrado.</p>';
    return;
  }

  eventos.forEach(ev => {
    const div = document.createElement('div');
    div.classList.add('evento-card');
    div.innerHTML = `
      <h3>${ev.nome}</h3>
      <p><b>Data:</b> ${ev.data}</p>
      <p><b>Local:</b> ${ev.local}</p>
      <button onclick="abrirModalLote(${ev.id})">Gerenciar Setores e Lotes</button>
      <button onclick="visualizarLotes(${ev.id})">Visualizar Lotes</button>
      <button onclick="editarLotes(${ev.id})">Editar Lotes</button>
      <button onclick="editarEvento(${ev.id})">Editar Evento</button>
      <button onclick="excluirEvento(${ev.id})">Excluir</button>
      <div id="lotes-${ev.id}" class="lotes-container" style="display:none;"></div>
    `;
    listaEventos.appendChild(div);
  });
}

renderEventos();

// === BACKUP / RESET ===
document.getElementById('btnExportar').onclick = () => {
  const blob = new Blob([JSON.stringify(eventos, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'backup-eventos.json';
  link.click();
};

document.getElementById('btnImportar').onclick = () => {
  const file = document.getElementById('importarBackup').files[0];
  if (!file) return alert('Selecione um arquivo JSON!');
  const reader = new FileReader();
  reader.onload = e => {
    eventos = JSON.parse(e.target.result);
    salvarLocal();
    renderEventos();
  };
  reader.readAsText(file);
};

document.getElementById('btnLimpar').onclick = () => {
  if (confirm('Apagar todos os dados?')) {
    localStorage.removeItem('eventos');
    eventos = [];
    renderEventos();
  }
};

document.getElementById('btnResetar').onclick = () => {
  if (confirm('Resetar todo o sistema?')) {
    localStorage.clear();
    eventos = [];
    renderEventos();
  }
};

// === EXCLUIR EVENTO ===
function excluirEvento(id) {
  eventos = eventos.filter(e => e.id !== id);
  salvarLocal();
  renderEventos();
}

// === VISUALIZAR LOTES ===
function visualizarLotes(id) {
  const evento = eventos.find(e => e.id === id);
  const cont = document.getElementById(`lotes-${id}`);
  if (!evento || !cont) return;
  const visivel = cont.style.display === 'block';
  cont.style.display = visivel ? 'none' : 'block';
  if (visivel) return;
  cont.innerHTML = '';

  if (!evento.lotes.length) {
    cont.innerHTML = '<p>Nenhum lote cadastrado.</p>';
    return;
  }

  evento.lotes.forEach((lote, i) => {
    const div = document.createElement('div');
    div.classList.add('lote-card');
    div.innerHTML = `<h3>Lote ${i + 1} - ${lote.nome || ''}</h3>`;
    lote.setores.forEach(s => {
      div.innerHTML += `
        <div class="setor-item">
          <h4>${s.setor}</h4>
          <p><b>Meia:</b> ${s.valores.meia}</p>
          <p><b>Solidário:</b> ${s.valores.solidario}</p>
          <p><b>Inteira:</b> ${s.valores.inteira}</p>
        </div>`;
    });
    cont.appendChild(div);
  });
}

// === MODAL DE LOTES ===
const modalLotes = document.getElementById('modalLotes');
const formLote = document.getElementById('formLote');
const cancelarLote = document.getElementById('cancelarLote');
const setoresContainer = document.getElementById('setoresContainer');
const qtdSetoresInput = document.getElementById('qtdSetores');

function abrirModalLote(eventoId, loteIndex = null) {
  document.getElementById('loteEventoId').value = eventoId;
  document.getElementById('editLoteIndex').value = loteIndex ?? '';
  document.getElementById('tituloModalLote').textContent = loteIndex === null ? 'Cadastrar Novo Lote' : 'Editar Lote';
  gerarSetores();
  modalLotes.style.display = 'flex';
}

cancelarLote.onclick = () => (modalLotes.style.display = 'none');
window.onclick = e => {
  if (e.target === modalLotes) modalLotes.style.display = 'none';
};

// === GERA OS CAMPOS DE SETORES ===
function gerarSetores() {
  setoresContainer.innerHTML = '';
  const qtd = parseInt(qtdSetoresInput.value) || 1;
  for (let i = 1; i <= qtd; i++) {
    const div = document.createElement('div');
    div.classList.add('setor-group');
    div.innerHTML = `
      <h3>Setor ${i}</h3>
      <label>Nome do Setor</label>
      <input type="text" class="setorNome">
      <label>Meia</label>
      <input type="text" class="setorMeia" oninput="formatarCampoMoeda(this)">
      <label>Solidário</label>
      <input type="text" class="setorSolidario" oninput="formatarCampoMoeda(this)">
      <label>Inteira</label>
      <input type="text" class="setorInteira" oninput="formatarCampoMoeda(this)">
    `;
    setoresContainer.appendChild(div);
  }
}
qtdSetoresInput.onchange = gerarSetores;

// === FORMATAÇÃO DE MOEDA EM TEMPO REAL ===
function formatarCampoMoeda(campo) {
  let valor = campo.value.replace(/[^\d]/g, '');
  valor = (valor / 100).toFixed(2) + '';
  valor = valor.replace('.', ',');
  valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  campo.value = 'R$ ' + valor;
}

// === SALVAR NOVO LOTE ===
formLote.addEventListener('submit', e => {
  e.preventDefault();
  const eventoId = Number(document.getElementById('loteEventoId').value);
  const evento = eventos.find(e => e.id === eventoId);
  const nomeLote = document.getElementById('nomeLote').value;
  const setores = [];

  document.querySelectorAll('.setor-group').forEach(div => {
    const setor = div.querySelector('.setorNome').value.trim();
    const meia = div.querySelector('.setorMeia').value || 'R$ 0,00';
    const solidario = div.querySelector('.setorSolidario').value || 'R$ 0,00';
    const inteira = div.querySelector('.setorInteira').value || 'R$ 0,00';
    if (setor) {
      setores.push({ setor, valores: { meia, solidario, inteira } });
    }
  });

  const lote = { nome: nomeLote, setores };

  const editIndex = document.getElementById('editLoteIndex').value;
  if (editIndex === '') evento.lotes.push(lote);
  else evento.lotes[Number(editIndex)] = lote;

  salvarLocal();
  modalLotes.style.display = 'none';
  renderEventos();
  alert('✅ Lote salvo com sucesso!');
});

// === EDITAR LOTE EXISTENTE ===
function editarLotes(eventoId) {
  const evento = eventos.find(e => e.id === eventoId);
  if (!evento || evento.lotes.length === 0) {
    alert('Nenhum lote cadastrado para editar.');
    return;
  }
  const indice = parseInt(prompt(`Qual lote deseja editar? (1 a ${evento.lotes.length})`)) - 1;
  if (isNaN(indice) || indice < 0 || indice >= evento.lotes.length) return;
  const lote = evento.lotes[indice];
  abrirModalLote(eventoId, indice);
  document.getElementById('nomeLote').value = lote.nome || '';
  document.getElementById('qtdSetores').value = lote.setores.length;
  gerarSetores();
  document.querySelectorAll('.setor-group').forEach((div, i) => {
    div.querySelector('.setorNome').value = lote.setores[i].setor;
    div.querySelector('.setorMeia').value = lote.setores[i].valores.meia;
    div.querySelector('.setorSolidario').value = lote.setores[i].valores.solidario;
    div.querySelector('.setorInteira').value = lote.setores[i].valores.inteira;
  });
}

// === MODAL DE EDIÇÃO DE EVENTO (igual antes) ===
const modal = document.getElementById('modalEditar');
const formEditar = document.getElementById('formEditar');
const cancelarEdicao = document.getElementById('cancelarEdicao');

function editarEvento(id) {
  const evento = eventos.find(e => e.id === id);
  document.getElementById('editId').value = evento.id;
  document.getElementById('editNome').value = evento.nome;
  document.getElementById('editData').value = evento.data;
  document.getElementById('editClassificacao').value = evento.classificacao;
  document.getElementById('editLocal').value = evento.local;
  document.getElementById('
