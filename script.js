// ===== SISTEMA DE EVENTOS LOCAL =====
let eventos = JSON.parse(localStorage.getItem('eventos')) || [];

const formEvento = document.getElementById('formEvento');
const listaEventos = document.getElementById('listaEventos');

// === SALVAR NOVO EVENTO ===
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

  if (!evento.nome) return alert("Preencha o nome do evento!");

  eventos.push(evento);
  salvarLocal();
  formEvento.reset();
  renderEventos();
});

// === RENDERIZAR EVENTOS ===
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

      <button onclick="gerenciarLotes(${ev.id})">Gerenciar Setores e Lotes</button>
      <button onclick="visualizarLotes(${ev.id})">Visualizar Lotes</button>
      <button onclick="editarEvento(${ev.id})">Editar</button>
      <button onclick="excluirEvento(${ev.id})">Excluir</button>

      <div id="lotes-${ev.id}" class="lotes-container" style="display:none;"></div>
    `;
    listaEventos.appendChild(div);
  });
}

// === EXCLUIR EVENTO ===
function excluirEvento(id) {
  const idNum = Number(id);
  eventos = eventos.filter(e => Number(e.id) !== idNum);
  salvarLocal();
  renderEventos();
}

// === SALVAR LOCALMENTE ===
function salvarLocal() {
  localStorage.setItem('eventos', JSON.stringify(eventos));
}

// Render inicial
renderEventos();

// === BACKUP E RESTAURAÇÃO ===
document.getElementById('btnExportar').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(eventos, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'backup-eventos.json';
  link.click();
});

document.getElementById('btnImportar').addEventListener('click', () => {
  const file = document.getElementById('importarBackup').files[0];
  if (!file) return alert('Selecione um arquivo JSON válido.');
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!Array.isArray(dados)) throw new Error();
      eventos = dados;
      salvarLocal();
      renderEventos();
      alert('Backup importado com sucesso!');
    } catch {
      alert('Erro ao importar arquivo. Certifique-se de que é um JSON válido.');
    }
  };
  reader.readAsText(file);
});

document.getElementById('btnLimpar').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar todos os dados locais?')) {
    localStorage.removeItem('eventos');
    eventos = [];
    renderEventos();
  }
});

// === RESETAR SISTEMA COMPLETO ===
document.getElementById('btnResetar').addEventListener('click', () => {
  if (confirm('⚠️ Deseja realmente RESETAR TODO o sistema? Todos os eventos e lotes serão apagados permanentemente!')) {
    localStorage.clear();
    eventos = [];
    renderEventos();
    alert('✅ Sistema totalmente resetado!');
  }
});

// === GERENCIAMENTO DE LOTES (com formatação monetária) ===
function gerenciarLotes(id) {
  const evento = eventos.find(e => e.id === id);
  if (!evento) return;

  const setores = prompt('Digite os setores (separados por vírgula):');
  if (!setores) return;

  const setoresArray = setores.split(',').map(s => s.trim()).slice(0, 5);
  const lote = { setores: [] };

  // Função interna para formatar valores como moeda
  const formatarMoeda = (valor) => {
    if (!valor) return "R$ 0,00";
    valor = valor.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
    const numero = parseFloat(valor) || 0;
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  setoresArray.forEach(setor => {
    let meia, solidario, inteira;
    do { meia = prompt(`Valor MEIA do setor "${setor}" (ex: 50,00):`); } while (!meia);
    do { solidario = prompt(`Valor SOLIDÁRIO do setor "${setor}" (ex: 60,00):`); } while (!solidario);
    do { inteira = prompt(`Valor INTEIRA do setor "${setor}" (ex: 100,00):`); } while (!inteira);

    lote.setores.push({
      setor,
      valores: {
        meia: formatarMoeda(meia),
        solidario: formatarMoeda(solidario),
        inteira: formatarMoeda(inteira)
      }
    });
  });

  evento.lotes.push(lote);
  salvarLocal();
  alert('💾 Lote salvo com sucesso!');
}

// === VISUALIZAR LOTES ===
function visualizarLotes(id) {
  const evento = eventos.find(e => e.id === id);
  const container = document.getElementById(`lotes-${id}`);
  if (!evento || !container) return;

  const aberto = container.style.display === 'block';
  container.style.display = aberto ? 'none' : 'block';
  if (aberto) return;

  if (!evento.lotes.length) {
    container.innerHTML = '<p>Nenhum lote cadastrado.</p>';
    return;
  }

  container.innerHTML = '';
  evento.lotes.forEach((lote, index) => {
    const divLote = document.createElement('div');
    divLote.classList.add('lote-card');

    let setoresHTML = '';
    lote.setores.forEach(s => {
      setoresHTML += `
        <div class="setor-item">
          <h4>${s.setor}</h4>
          <p><b>Meia:</b> ${s.valores.meia || '-'}</p>
          <p><b>Solidário:</b> ${s.valores.solidario || '-'}</p>
          <p><b>Inteira:</b> ${s.valores.inteira || '-'}</p>
        </div>
      `;
    });

    divLote.innerHTML = `
      <h3>Lote ${index + 1}</h3>
      ${setoresHTML}
      <hr>
    `;
    container.appendChild(divLote);
  });
}

// === EDITAR EVENTO (COM MODAL) ===
const modal = document.getElementById('modalEditar');
const formEditar = document.getElementById('formEditar');
const cancelarEdicao = document.getElementById('cancelarEdicao');

function editarEvento(id) {
  const evento = eventos.find(e => e.id === id);
  if (!evento) return;

  document.getElementById('editId').value = evento.id;
  document.getElementById('editNome').value = evento.nome;
  document.getElementById('editData').value = evento.data;
  document.getElementById('editClassificacao').value = evento.classificacao;
  document.getElementById('editLocal').value = evento.local;
  document.getElementById('editPagamento').value = evento.pagamento;
  document.getElementById('editDescricao').value = evento.descricao;

  modal.style.display = 'flex';
}

cancelarEdicao.addEventListener('click', () => {
  modal.style.display = 'none';
});

formEditar.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = Number(document.getElementById('editId').value);
  const evento = eventos.find(e => e.id === id);
  if (!evento) return;

  evento.nome = document.getElementById('editNome').value.trim();
  evento.data = document.getElementById('editData').value.trim();
  evento.classificacao = document.getElementById('editClassificacao').value.trim();
  evento.local = document.getElementById('editLocal').value.trim();
  evento.pagamento = document.getElementById('editPagamento').value.trim();
  evento.descricao = document.getElementById('editDescricao').value.trim();

  salvarLocal();
  renderEventos();
  modal.style.display = 'none';
  alert('✅ Evento atualizado com sucesso!');
});

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});
