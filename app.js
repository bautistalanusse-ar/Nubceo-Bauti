// Sample Data
const rankingData = [
    { name: 'Ana Silva', avatar: 'AS', score: 145000, deals: 24 },
    { name: 'Carlos Ruiz', avatar: 'CR', score: 121000, deals: 19 },
    { name: 'Vendedor Beta', avatar: 'VB', score: 98000, deals: 15 },
    { name: 'Lucía Ortiz', avatar: 'LO', score: 85500, deals: 12 },
    { name: 'Miguel Paz', avatar: 'MP', score: 62000, deals: 8 }
];

const pipelineData = [
    {
        id: 'col-1', title: 'Contacto Inicial', amount: 45000,
        cards: [
            { id: 'c1', title: 'Renovación Licencias', company: 'TechCorp SA', value: 12000, date: 'Hoy' },
            { id: 'c2', title: 'Consultoría Nube', company: 'DevOps Inc.', value: 8000, date: 'Hace 2 días' },
            { id: 'c3', title: 'Migración Datos', company: 'Finanzas Sur', value: 25000, date: 'Ayer' }
        ]
    },
    {
        id: 'col-2', title: 'Reunión / Demo', amount: 68000,
        cards: [
            { id: 'c4', title: 'Demo Plataforma', company: 'Retail Global', value: 35000, date: 'Agendado: Jueves' },
            { id: 'c5', title: 'Análisis Requisitos', company: 'Logística Plus', value: 33000, date: 'Agendado: Viernes' }
        ]
    },
    {
        id: 'col-3', title: 'Propuesta Enviada', amount: 150000,
        cards: [
            { id: 'c6', title: 'Suscripción Anual Enterprise', company: 'MegaCorp LTDA', value: 120000, date: 'Enviada: Lun' },
            { id: 'c7', title: 'Plan Pro 50 Usuarios', company: 'Agencia Creativa', value: 30000, date: 'Enviada: Mar' }
        ]
    },
    {
        id: 'col-4', title: 'Ganados (Cierre)', amount: 45200,
        cards: [
            { id: 'c8', title: 'Onboarding Inicial', company: 'Startup XYZ', value: 15200, date: 'Cerrado: Hoy' },
            { id: 'c9', title: 'Licencias Q3', company: 'Manufacturas del Norte', value: 30000, date: 'Cerrado: Lun' }
        ]
    }
];

const tasksData = [
    { id: 't1', title: 'Llamar a Director IT de MegaCorp', contact: 'Roberto Gómez', priority: 'high', completed: false },
    { id: 't2', title: 'Preparar presentación para Retail Global', contact: '-', priority: 'medium', completed: false },
    { id: 't3', title: 'Enviar contrato a Startup XYZ', contact: 'María Paz', priority: 'high', completed: true },
    { id: 't4', title: 'Follow-up email mensual', contact: 'Varios', priority: 'low', completed: false },
];

const leadsData = [
    { id: 'l1', name: 'Laura Martinez', company: 'TechCorp SA', lastContact: 'Hace 2 horas', status: 'hot', label: 'En Negociación' },
    { id: 'l2', name: 'Roberto Gómez', company: 'MegaCorp LTDA', lastContact: 'Ayer', status: 'hot', label: 'Propuesta' },
    { id: 'l3', name: 'Juan Pérez', company: 'Logística Plus', lastContact: 'Hace 3 días', status: 'warm', label: 'Reunión' },
    { id: 'l4', name: 'Sofía Castro', company: 'Agencia Creativa', lastContact: 'Hace 1 semana', status: 'warm', label: 'Seguimiento' },
    { id: 'l5', name: 'Diego López', company: 'Finanzas Sur', lastContact: 'Hace 1 mes', status: 'cold', label: 'Inactivo' }
];

// formatting helpers
const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderRanking();
    renderPipeline();
    renderTasks();
    renderLeads();
    initChart();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');
    const titleElement = document.getElementById('current-view-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all navs
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked nav
            item.classList.add('active');
            
            // Get target view
            const targetId = item.getAttribute('data-target');
            titleElement.innerText = item.innerText.trim();
            
            // Toggle views
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) {
                    view.classList.add('active');
                }
            });
        });
    });
}

function renderRanking() {
    const container = document.getElementById('ranking-list-container');
    container.innerHTML = '';
    
    rankingData.forEach((user, index) => {
        const itemHtml = `
            <div class="ranking-item">
                <div class="ranking-user">
                    <div class="ranking-pos top-${index + 1}">#${index + 1}</div>
                    <div class="avatar" style="width: 32px; height: 32px; font-size: 0.8rem; background-color: var(--bg-surface-hover); color: var(--text-main); box-shadow: none; border: 1px solid var(--border);">${user.avatar}</div>
                    <div>
                        <div class="ranking-name">${user.name} ${index === 2 ? '(Tú)' : ''}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${user.deals} negocios cerrados</div>
                    </div>
                </div>
                <div class="ranking-score">${formatCurrency(user.score)}</div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

function renderPipeline() {
    const board = document.getElementById('kanban-board');
    board.innerHTML = '';

    pipelineData.forEach(col => {
        let cardsHtml = '';
        col.cards.forEach(card => {
            cardsHtml += `
                <div class="kanban-card" draggable="true" ondragstart="drag(event)" id="${card.id}">
                    <div class="card-title">${card.title}</div>
                    <div class="card-company"><i class="fa-regular fa-building text-muted"></i> ${card.company}</div>
                    <div class="card-footer">
                        <span class="card-value">${formatCurrency(card.value)}</span>
                        <span class="card-date"><i class="fa-regular fa-clock"></i> ${card.date}</span>
                    </div>
                </div>
            `;
        });

        const colHtml = `
            <div class="kanban-column" ondrop="drop(event)" ondragover="allowDrop(event)">
                <div class="kanban-header">
                    <div class="kanban-title">
                        ${col.title} <span class="kanban-count">${col.cards.length}</span>
                    </div>
                    <div class="kanban-amount">${formatCurrency(col.amount)}</div>
                </div>
                <div class="kanban-cards">
                    ${cardsHtml}
                </div>
            </div>
        `;
        board.innerHTML += colHtml;
    });
}

function renderTasks() {
    const container = document.getElementById('task-list-container');
    container.innerHTML = '';

    tasksData.forEach(task => {
        const priorityLabel = task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MEDIA' : 'BAJA';
        const checked = task.completed ? 'checked' : '';
        const completedClass = task.completed ? 'completed' : '';

        const taskHtml = `
            <div class="task-item ${completedClass}">
                <input type="checkbox" class="task-checkbox" ${checked} onchange="toggleTask(this)">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span><i class="fa-regular fa-user"></i> ${task.contact}</span>
                        <span class="task-priority priority-${task.priority}">${priorityLabel}</span>
                    </div>
                </div>
                <button class="action-btn" style="border: none; color: var(--text-muted);" title="Eliminar/Posponer">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </button>
            </div>
        `;
        container.innerHTML += taskHtml;
    });
}

function toggleTask(checkbox) {
    const item = checkbox.closest('.task-item');
    if (checkbox.checked) {
        item.classList.add('completed');
    } else {
        item.classList.remove('completed');
    }
}

function renderLeads(filterText = '') {
    const tbody = document.getElementById('leads-table-body');
    tbody.innerHTML = '';

    const filtered = leadsData.filter(lead => 
        lead.name.toLowerCase().includes(filterText.toLowerCase()) || 
        lead.company.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.forEach(lead => {
        const initials = lead.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="lead-name-col">
                    <div class="lead-avatar">${initials}</div>
                    <div>
                        <div style="font-weight: 500;">${lead.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-regular fa-envelope"></i> ${lead.name.split(' ')[0].toLowerCase()}@${lead.company.toLowerCase().replace(' ', '')}.com</div>
                    </div>
                </div>
            </td>
            <td><div style="font-weight: 500; color: var(--text-main);">${lead.company}</div></td>
            <td><div style="color: var(--text-muted);">${lead.lastContact}</div></td>
            <td><span class="status-badge status-${lead.status}">${lead.label}</span></td>
            <td>
                <button class="action-btn" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;">Ver Perfil</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Search functionality
document.getElementById('search-leads').addEventListener('input', (e) => {
    renderLeads(e.target.value);
});


// Chart.JS Initialization
function initChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Gradient definitions
    const gradientLine = ctx.createLinearGradient(0, 0, 0, 400);
    gradientLine.addColorStop(0, 'rgba(0, 242, 254, 1)');   // Cyan
    gradientLine.addColorStop(1, 'rgba(79, 172, 254, 1)');

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(0, 242, 254, 0.2)');
    gradientFill.addColorStop(1, 'rgba(0, 242, 254, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Ingresos Cerrados ($)',
                data: [12000, 19000, 15000, 22000, 30000, 28000, 45200],
                borderColor: gradientLine,
                backgroundColor: gradientFill,
                borderWidth: 3,
                pointBackgroundColor: '#0a0e17',
                pointBorderColor: '#00f2fe',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(19, 27, 44, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#00f2fe',
                    borderColor: '#1e293b',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return '$' + (value / 1000) + 'k';
                        }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#94a3b8' }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Simple Drag and Drop implementation for HTML5 Kanban
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.target.style.opacity = '0.5';
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const el = document.getElementById(data);
    el.style.opacity = '1';
    
    // Find the closest kanban-cards container
    const container = ev.target.closest('.kanban-column');
    if (container) {
        const cardsList = container.querySelector('.kanban-cards');
        cardsList.appendChild(el);
    }
}

document.addEventListener('dragend', (ev) => {
    ev.target.style.opacity = '1';
});
