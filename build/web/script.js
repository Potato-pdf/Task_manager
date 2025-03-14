let selectedTask = null;

// Cargar tareas al iniciar la página
loadTasks();

// Función única para el modal
function openModal() {
    const modal = document.getElementById('taskModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    validateDueDate();
    clearValidationErrors();
}

// Función única para cerrar el modal
function closeModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        
        // Restablecer el formulario si existe
        const form = document.getElementById('taskForm');
        if (form) {
            form.reset();
        }
        
        clearValidationErrors();
        selectedTask = null; // Restablecer la tarea seleccionada si hay alguna
    }
    console.log('Modal cerrado');
}

// Event Listeners para modal - ÚNICO BLOQUE
document.addEventListener('DOMContentLoaded', function() {
    // Botón para mostrar el formulario
    document.getElementById('showFormButton').addEventListener('click', openModal);
    
    // Cerrar con X - verifica ambas posibles referencias al botón de cierre
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    const closeX = document.querySelector('.close');
    if (closeX && closeX !== closeBtn) {
        closeX.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    // Botón cancelar
    const cancelBtn = document.getElementById('cancelButton');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    // También usado en tu código
    const cancelUpdateBtn = document.getElementById('cancelUpdate');
    if (cancelUpdateBtn) {
        cancelUpdateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    }
    
    // Cerrar al hacer clic fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('taskModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    console.log('Modal event listeners inicializados correctamente');
});

// Update task creation in form submit
document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const dueDate = document.getElementById('dueDate').value;
    const priority = document.getElementById('priority').value;
    const roleNombre = document.getElementById('role').value;
    const nivelExperiencia = parseInt(document.getElementById('experienceLevel').value);
    const tags = document.getElementById('tags').value.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);

    const role = {
        nombre: roleNombre,
        descripcion: getRoleDescription(roleNombre),
        nivel_experiencia: nivelExperiencia
    };

    fetch('http://localhost:8080/task_manager/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title, 
            description, 
            dueDate, 
            priority, 
            tags,
            role 
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al agregar la tarea');
        }
        return response.json();
    })
    .then(data => {
        console.log('Tarea agregada:', data);
        loadTasks(); // Recargar las tareas después de agregar una nueva
        closeModal(); // Cerrar el modal después de agregar
        showMessage('Tarea creada correctamente');
    })
    .catch(error => {
        showMessage('Error: ' + error.message);
        console.error('Error:', error);
    });
});

// Add helper function to get role description
function getRoleDescription(roleName) {
    const roleDescriptions = {
        'Desarrollador Backend': 'Encargado de desarrollar la lógica del servidor y APIs.',
        'Desarrollador Frontend': 'Encargado de desarrollar la interfaz de usuario.',
        'Ingeniero de DevOps': 'Encargado de la infraestructura y despliegue.',
        'Arquitecto de Software': 'Encargado del diseño y arquitectura del sistema.',
        'Analista de Calidad': 'Encargado de asegurar la calidad del software.'
    };
    return roleDescriptions[roleName] || '';
}

// Update loadTasks function to display role
function loadTasks() {
    fetch('http://localhost:8080/task_manager/tasks')
        .then(response => response.json())
        .then(tasks => {
            document.getElementById('highPriorityTasks').innerHTML = '';
            document.getElementById('mediumPriorityTasks').innerHTML = '';
            document.getElementById('lowPriorityTasks').innerHTML = '';

            tasks.forEach(task => {
                // No mostrar tareas completadas (solo para la vista)
                if (task.completed) {
                    return;
                }
                
                const card = document.createElement('div');
                card.className = 'task-card';
                card.setAttribute('data-task-id', task._id.$oid || task._id);
                
                const tagsArray = task.tags ? task.tags : [];
                const tagsHtml = tagsArray.map(tag => 
                    `<span class="tag">${tag}</span>`
                ).join('');
                
                card.innerHTML = `
                    <h3><i class="fas fa-thumbtack"></i> ${task.title}</h3>
                    <p>${task.description}</p>
                    <div class="due-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <div class="role">
                        <i class="fas fa-user-tag"></i>
                        <span>${task.role ? task.role.nombre : 'Sin rol asignado'}</span>
                        ${task.role && task.role.nivel_experiencia ? 
                            `<span class="experience-level">
                                <i class="fas fa-star"></i> 
                                Nivel ${task.role.nivel_experiencia}
                            </span>` : ''
                        }
                    </div>
                    <div class="role-description">
                        <i class="fas fa-info-circle"></i>
                        <span>${task.role ? task.role.descripcion : ''}</span>
                    </div>
                    <div class="tags">
                        ${tagsHtml}
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" title="Editar tarea">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="complete-btn" title="Marcar como completada">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    </div>
                `;

                // Añadir eventos a los botones dentro de la tarjeta
                const editBtn = card.querySelector('.edit-btn');
                editBtn.addEventListener('click', function() {
                    openTaskModal(task);
                });
                
                const completeBtn = card.querySelector('.complete-btn');
                completeBtn.addEventListener('click', function() {
                    markTaskAsCompleted(task, card);
                });

                const container = document.getElementById(
                    task.priority === 'alta' ? 'highPriorityTasks' :
                    task.priority === 'media' ? 'mediumPriorityTasks' : 'lowPriorityTasks'
                );
                container.appendChild(card);
            });
        })
        .catch(error => {
            showMessage('Error al cargar las tareas');
            console.error('Error:', error);
        });
}

// Nueva función para marcar una tarea como completada
function markTaskAsCompleted(task, cardElement) {
    const taskId = task._id.$oid || task._id;
    
    // Animación de desvanecimiento antes de eliminar
    cardElement.classList.add('completed');
    
    // Mostrar mensaje de confirmación
    showMessage('¡Tarea completada!');
    
    // Eliminar la tarjeta del DOM después de la animación
    setTimeout(() => {
        cardElement.remove();
    }, 500);
    
    // Actualizar en el backend (opcional - ya tienes esta lógica)
    // Si quieres que se refleje en el backend, descomenta este bloque
    /*
    const updatedTask = {...task, completed: true};
    
    fetch(`http://localhost:8080/task_manager/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.error) {
                throw new Error(data.error);
            }
            console.log('Tarea marcada como completada en el backend');
        } catch (e) {
            throw new Error('Error al procesar la respuesta del servidor');
        }
    })
    .catch(error => {
        console.error('Error al actualizar el estado en el backend:', error);
    });
    */
}

// Abrir modal para modificar tarea
function openTaskModal(task) {
    selectedTask = task;
    const taskId = task._id.$oid || task._id;
    console.log('ID de tarea seleccionada:', taskId); // Para debugging
    
    document.getElementById('updateTitle').value = task.title;
    document.getElementById('updateDescription').value = task.description;
    document.getElementById('updateDueDate').value = task.dueDate;
    document.getElementById('updatePriority').value = task.priority;
    document.getElementById('updateTags').value = task.tags ? task.tags.join(', ') : '';
    document.getElementById('updateCompleted').checked = task.completed || false;
    document.getElementById('taskModal').style.display = 'block';
}

// Evento submit del formulario de actualización
document.getElementById('updateTaskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!selectedTask || !selectedTask._id) {
        showMessage('Error: No hay tarea seleccionada');
        return;
    }

    const taskId = selectedTask._id.$oid || selectedTask._id;
    console.log('Actualizando tarea con ID:', taskId); // Para debugging

    const updatedTask = {
        title: document.getElementById('updateTitle').value,
        description: document.getElementById('updateDescription').value,
        dueDate: document.getElementById('updateDueDate').value,
        priority: document.getElementById('updatePriority').value,
        tags: document.getElementById('updateTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        completed: document.getElementById('updateCompleted').checked
    };

    fetch(`http://localhost:8080/task_manager/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.error) {
                throw new Error(data.error);
            }
            loadTasks();
            closeModal();
            showMessage(data.message || 'Tarea actualizada correctamente');
        } catch (e) {
            throw new Error('Error al procesar la respuesta del servidor');
        }
    })
    .catch(error => {
        showMessage('Error: ' + error.message);
        console.error('Error:', error);
    });
});

// Botón para eliminar tarea
document.getElementById('deleteTask').addEventListener('click', function() {
    if (!selectedTask || !selectedTask._id) {
        showMessage('Error: No hay tarea seleccionada');
        return;
    }

    const taskId = selectedTask._id.$oid || selectedTask._id;
    console.log('Eliminando tarea con ID:', taskId); // Para debugging

    if (confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        fetch(`http://localhost:8080/task_manager/tasks/${taskId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            try {
                const data = JSON.parse(text);
                if (data.error) {
                    throw new Error(data.error);
                }
                loadTasks();
                closeModal();
                showMessage(data.message || 'Tarea eliminada correctamente');
            } catch (e) {
                throw new Error('Error al procesar la respuesta del servidor');
            }
        })
        .catch(error => {
            showMessage('Error: ' + error.message);
            console.error('Error:', error);
        });
    }
});

// Mostrar mensaje de confirmación
function showMessage(message) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.classList.add('show');
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
}

// Form validation functions
function validateDueDate() {
    const dueDateInput = document.getElementById('dueDate');
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;
}

function validateForm() {
    let isValid = true;
    clearValidationErrors();

    // Validate title
    const title = document.getElementById('title');
    if (!title.value.trim()) {
        showError(title, 'El título es obligatorio');
        isValid = false;
    } else if (!title.value.match(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]{3,50}$/)) {
        showError(title, 'El título debe tener entre 3 y 50 caracteres y no contener caracteres especiales');
        isValid = false;
    }

    // Validate description
    const description = document.getElementById('description');
    if (!description.value.trim()) {
        showError(description, 'La descripción es obligatoria');
        isValid = false;
    } else if (description.value.length < 10) {
        showError(description, 'La descripción debe tener al menos 10 caracteres');
        isValid = false;
    } else if (description.value.length > 200) {
        showError(description, 'La descripción no puede exceder los 200 caracteres');
        isValid = false;
    }

    // Validate due date
    const dueDate = document.getElementById('dueDate');
    const selectedDate = new Date(dueDate.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!dueDate.value) {
        showError(dueDate, 'La fecha es obligatoria');
        isValid = false;
    } else if (selectedDate < today) {
        showError(dueDate, 'La fecha no puede ser anterior a hoy');
        isValid = false;
    } else if (selectedDate > new Date(today.setFullYear(today.getFullYear() + 1))) {
        showError(dueDate, 'La fecha no puede ser mayor a un año desde hoy');
        isValid = false;
    }

    // Validate priority
    const priority = document.getElementById('priority');
    if (!priority.value) {
        showError(priority, 'Debe seleccionar una prioridad');
        isValid = false;
    }

    // Validate tags
    const tags = document.getElementById('tags');
    if (tags.value) {
        const tagList = tags.value.split(',').map(tag => tag.trim());
        
        // Check individual tag length
        if (tagList.some(tag => tag.length > 20)) {
            showError(tags, 'Cada etiqueta debe tener máximo 20 caracteres');
            isValid = false;
        }
        
        // Check number of tags
        if (tagList.length > 5) {
            showError(tags, 'Máximo 5 etiquetas permitidas');
            isValid = false;
        }
        
        // Check for duplicate tags
        if (new Set(tagList).size !== tagList.length) {
            showError(tags, 'No se permiten etiquetas duplicadas');
            isValid = false;
        }
        
        // Check tag format
        if (!tags.value.match(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9,\s]*$/)) {
            showError(tags, 'Las etiquetas solo pueden contener letras, números y comas');
            isValid = false;
        }
    }

    // Validate role
    const role = document.getElementById('role');
    if (!role.value) {
        showError(role, 'Debe seleccionar un rol');
        isValid = false;
    }

    // Validate experience level
    const experienceLevel = document.getElementById('experienceLevel');
    if (!experienceLevel.value) {
        showError(experienceLevel, 'Debe seleccionar un nivel de experiencia');
        isValid = false;
    }

    return isValid;
}

function showError(element, message) {
    element.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    element.parentNode.appendChild(errorDiv);
}

function clearValidationErrors() {
    document.querySelectorAll('.error').forEach(element => {
        element.classList.remove('error');
    });
    document.querySelectorAll('.error-message').forEach(element => {
        element.remove();
    });
}

// Validación en tiempo real para el título
document.getElementById('title').addEventListener('input', function() {
    // Limpiar errores anteriores para este elemento
    this.classList.remove('error');
    const errorMessages = this.parentNode.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    if (this.value.trim().length > 0 && !this.value.match(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]{3,50}$/)) {
        showError(this, 'El título debe tener entre 3 y 50 caracteres y no contener caracteres especiales');
    }
});

// Validación en tiempo real para la descripción
document.getElementById('description').addEventListener('input', function() {
    // Limpiar errores anteriores para este elemento
    this.classList.remove('error');
    const errorMessages = this.parentNode.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    if (this.value.trim().length > 0) {
        if (this.value.length < 10) {
            showError(this, 'La descripción debe tener al menos 10 caracteres');
        } else if (this.value.length > 200) {
            showError(this, 'La descripción no puede exceder los 200 caracteres');
        }
    }
});

// Add spell checking to title and description inputs
document.getElementById('title').addEventListener('blur', function() {
    const result = checkSpelling(this.value);
    if (result.corrected) {
        if (confirm('¿Desea corregir la ortografía?')) {
            this.value = result.text;
        }
    }
});

document.getElementById('description').addEventListener('blur', function() {
    const result = checkSpelling(this.value);
    if (result.corrected) {
        if (confirm('¿Desea corregir la ortografía?')) {
            this.value = result.text;
        }
    }
});

// Si tienes una función checkSpelling ya definida mantenla aquí, si no, define una básica
// para evitar errores de referencia
if (typeof checkSpelling !== 'function') {
    function checkSpelling(text) {
        // Esta es una función placeholder si no existe ya
        return { corrected: false, text: text };
    }
}