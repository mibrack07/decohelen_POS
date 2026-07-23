// ALGORITMO DE COMPARACIÓN PERFECTA PARA LA IA LOCAL
function buscarProductoPreciso(texto, inventario) {
    let mejorProducto = null;
    let mejorPuntaje = 0;
    let textoLimpio = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let catalogoOrdenado = Object.keys(inventario).sort((a, b) => b.length - a.length);

    for (let nombre of catalogoOrdenado) {
        let nombreLimpio = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (textoLimpio.includes(nombreLimpio)) return nombre;

        let palabrasNombre = nombreLimpio.split(" ").filter(p => p.length > 2);
        let palabrasTexto = textoLimpio.split(" ").filter(p => p.length > 2);
        
        let coincidencias = 0;
        palabrasNombre.forEach(p => { 
            if (palabrasTexto.includes(p) || textoLimpio.includes(p)) coincidencias++; 
        });

        let ratio = coincidencias / palabrasNombre.length;
        if (ratio >= 0.70 && coincidencias > mejorPuntaje) {
            mejorPuntaje = coincidencias;
            mejorProducto = nombre;
        }
    }
    return mejorProducto;
}

function abrirModuloAdmin() { 
    document.getElementById('modal-admin').classList.remove('hidden'); 
    cargarHistorialVentas();
    cargarTablaInventarioAdmin();
    cargarTablaEliminar();
}

function cerrarModuloAdmin() { 
    document.getElementById('modal-admin').classList.add('hidden'); 
}

function switchSubTab(evt, tabId) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function cambiarClave() {
    let nueva = document.getElementById("new-pass").value.trim();
    if (nueva.length < 4) { alert("La contraseña debe tener al menos 4 caracteres."); return; }
    localStorage.setItem("admin_pass", nueva);
    alert("Contraseña actualizada correctamente.");
    document.getElementById("new-pass").value = "";
}

function cargarTablaInventarioAdmin() {
    const marca = document.getElementById("marca-activa").value;
    const inventario = productosDB[marca] || {};
    
    document.querySelectorAll(".tbody-admin-compartido").forEach(tbody => {
        tbody.innerHTML = "";
        Object.keys(inventario).forEach(nom => {
            let p = inventario[nom];
            let badgeDescuento = (p.descuento && p.descuento > 0) ? `<span style="color:#e84118; font-size:9px;">(-${p.descuento}%)</span>` : "";
            tbody.innerHTML += `<tr>
                <td>${p.codigo}</td>
                <td>${p.categoria}</td>
                <td style="text-align: left; font-weight: bold; color: var(--color-acento);">${nom}</td>
                <td style="text-align: left;">${p.detalle.length > 25 ? p.detalle.substring(0, 25) + '...' : p.detalle}</td>
                <td>${p.rendimiento}</td>
                <td style="color: #27ae60; font-weight: bold;">$${p.precio.toFixed(2)} ${badgeDescuento}</td>
            </tr>`;
        });
    });

    // CORRECCIÓN SOLICITADA: Filtrar Descuentos Estrictamente por Marca Activa
    const tbodyDesc = document.querySelector("#tabla-solo-descuentos tbody");
    if (tbodyDesc) {
        tbodyDesc.innerHTML = "";
        let hayDescuentos = false;
        Object.keys(inventario).forEach(nom => {
            let p = inventario[nom];
            if (p.descuento && p.descuento > 0) {
                hayDescuentos = true;
                let precioPromocion = p.precio - (p.precio * (p.descuento / 100));
                tbodyDesc.innerHTML += `<tr>
                    <td>${p.codigo}</td>
                    <td style="text-align: left; font-weight: bold; color: var(--color-acento);">${nom} <span style="font-size:9px; color:#7f8fa6;">(${marca})</span></td>
                    <td>$${p.precio.toFixed(2)}</td>
                    <td style="color: #e84118; font-weight: bold;">-${p.descuento}%</td>
                    <td style="color: #27ae60; font-weight: bold;">$${precioPromocion.toFixed(2)}</td>
                </tr>`;
            }
        });
        if (!hayDescuentos) {
            tbodyDesc.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #7f8fa6; padding: 25px; font-weight:bold;">No hay productos en descuento o promoción en la marca ${marca}.</td></tr>`;
        }
    }

    const tbodyPos = document.getElementById("tbody-catalogo-pos");
    if(tbodyPos) {
        tbodyPos.innerHTML = "";
        Object.keys(inventario).forEach(nom => {
            let p = inventario[nom];
            let badgeDescuento = (p.descuento && p.descuento > 0) ? `<span style="color:#e84118; font-size:10px;">(-${p.descuento}%)</span>` : "";
            tbodyPos.innerHTML += `<tr>
                <td>${p.codigo}</td>
                <td>${p.categoria}</td>
                <td style="text-align: left; font-weight: bold; color: var(--color-acento);">${nom}</td>
                <td style="text-align: left;">${p.detalle}</td>
                <td>${p.rendimiento}</td>
                <td style="color: #27ae60; font-weight: bold;">$${p.precio.toFixed(2)} ${badgeDescuento}</td>
            </tr>`;
        });
    }

    if (typeof cargarTablaEliminar === "function") cargarTablaEliminar();
}

function cargarHistorialVentas() {
    const tbody = document.querySelector("#tabla-historial tbody");
    tbody.innerHTML = "";
    let historial = JSON.parse(localStorage.getItem("historial_ventas")) || [];
    historial.forEach((v, index) => {
        tbody.innerHTML += `<tr>
            <td><input type="checkbox" class="chk-historial" data-index="${index}"></td>
            <td>${v.fecha}</td><td>${v.hora || "--:--"}</td><td>${v.factura}</td><td>${v.cliente}</td>
            <td>${v.rif}</td><td>$${v.usd.toFixed(2)}</td><td>USDT ${v.bs.toFixed(2)}</td>
        </tr>`;
    });
}

function toggleSelectAllHistorial(master) {
    document.querySelectorAll(".chk-historial").forEach(c => c.checked = master.checked);
}

function borrarVentasSeleccionadas() {
    let historial = JSON.parse(localStorage.getItem("historial_ventas") || "[]");
    let chks = document.querySelectorAll(".chk-historial:checked");
    if (chks.length === 0) { alert("Selecciona al menos una venta para borrar."); return; }
    
    let indicesBorrar = Array.from(chks).map(c => parseInt(c.dataset.index));
    let nuevoHistorial = historial.filter((_, idx) => !indicesBorrar.includes(idx));
    localStorage.setItem("historial_ventas", JSON.stringify(nuevoHistorial));
    cargarHistorialVentas();
}

function borrarVentasPorTiempo(rango) {
    let historial = JSON.parse(localStorage.getItem("historial_ventas") || "[]");
    let ahora = new Date().getTime();
    let limite = ahora;

    if (rango === 'dia') limite -= (24 * 60 * 60 * 1000);
    else if (rango === 'semana') limite -= (7 * 24 * 60 * 60 * 1000);
    else if (rango === 'mes') limite -= (30 * 24 * 60 * 60 * 1000);

    let filtrado = historial.filter(v => {
        let partes = v.fecha.split('/');
        let fechaVenta = new Date(partes[2], partes[1] - 1, partes[0]).getTime();
        return fechaVenta < limite;
    });

    localStorage.setItem("historial_ventas", JSON.stringify(filtrado));
    cargarHistorialVentas();
}

function borrarHistorial() {
    if (confirm("¿Vaciar todo el historial permanentemente?")) {
        localStorage.setItem("historial_ventas", JSON.stringify([]));
        cargarHistorialVentas();
    }
}

function descargarExcelBackupHistorial() {
    let historial = JSON.parse(localStorage.getItem("historial_ventas") || "[]");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(historial);
    XLSX.utils.book_append_sheet(wb, ws, "Historial_Ventas");
    XLSX.writeFile(wb, "Backup_Historial_Ventas.xlsx");
}

function descargarBackupCatalogo() {
    const wb = XLSX.utils.book_new();
    
    ["Dekomundo", "Dokka", "Castell"].forEach(marca => {
        let inventario = productosDB[marca] || {};
        let data = [["CÓDIGO", "CATEGORÍA", "NOMBRE Y DESCRIPCIÓN DEL PRODUCTO", "MEDIDAS Y ESPECIFICACIONES", "RENDIMIENTO", "PRECIO $", "STOCK", "DESCUENTO"]];
        
        Object.keys(inventario).forEach(nom => {
            let p = inventario[nom];
            data.push([p.codigo, p.categoria, nom, p.detalle, p.rendimiento, p.precio, p.stock || 100, p.descuento || 0]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, marca);
    });
    
    let d = new Date();
    let fecha = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
    XLSX.writeFile(wb, `Catalogo_Actualizado_Decohelen_${fecha}.xlsx`);
    alert("✅ Catálogo exportado correctamente a tu computadora. Úsalo como respaldo de seguridad.");
}

function autoRepararSistema() {
    let backupEmergencia = localStorage.getItem("backup_emergencia");
    let backups = JSON.parse(localStorage.getItem("db_backups") || "[]");
    
    if (backupEmergencia && backupEmergencia !== "{}" && backupEmergencia.length > 50) {
        productosDB = JSON.parse(backupEmergencia);
    } else if (backups.length > 0) {
        productosDB = backups[backups.length - 1].data;
    } else {
        alert("⚠️ No hay datos internos guardados. Por favor usa el botón 'Importar Catálogo' para subir tu Excel.");
        return;
    }
    
    window.appPOS.guardarCambiosMemoria();
    cargarTablaInventarioAdmin();
    alert("🛠️ Reparación completada. Se han restaurado los últimos productos, precios y descuentos guardados internamente.");
}

// CORRECCIÓN SOLICITADA: Arreglado el guardado manual que estaba bloqueado
function guardarProducto() {
    const cod = document.getElementById("inv-cod").value.trim() || "NEW-" + Math.floor(Math.random()*1000);
    const cat = document.getElementById("inv-cat").value.trim() || "General";
    const nom = document.getElementById("inv-nom").value.trim();
    const det = document.getElementById("inv-det").value.trim() || "";
    let rend = parseFloat(document.getElementById("inv-rend").value);
    const pre = parseFloat(document.getElementById("inv-pre").value);

    if (!nom || isNaN(pre)) { alert("El Nombre y Precio son obligatorios."); return; }
    if (isNaN(rend) || rend <= 0) rend = 1.0; 

    let marcaActual = document.getElementById("marca-activa").value; 
    
    if (!productosDB[marcaActual]) productosDB[marcaActual] = {};
    productosDB[marcaActual][nom] = { codigo: cod, categoria: cat, detalle: det, rendimiento: rend, precio: pre, descuento: 0 };
    
    window.appPOS.guardarCambiosMemoria();
    cargarTablaInventarioAdmin(); 
    
    document.getElementById("inv-cod").value = ""; document.getElementById("inv-cat").value = "";
    document.getElementById("inv-nom").value = ""; document.getElementById("inv-det").value = "";
    document.getElementById("inv-rend").value = ""; document.getElementById("inv-pre").value = "";
    
    document.getElementById("preview-admin-add").innerText = `✅ Guardado manualmente en ${marcaActual}: ${nom}`;
    setTimeout(() => document.getElementById("preview-admin-add").innerText = "", 4000);
}

function detectarYCambiarMarca(texto) {
    const marcas = ["dekomundo", "dokka", "castell"];
    let marcaEncontrada = null;
    const textoLower = texto.toLowerCase();
    for (let m of marcas) {
        if (textoLower.includes(m)) {
            marcaEncontrada = m;
            break;
        }
    }
    if (marcaEncontrada) {
        const marcaFormateada = marcaEncontrada.charAt(0).toUpperCase() + marcaEncontrada.slice(1);
        const select = document.getElementById("marca-activa");
        if (select && select.value !== marcaFormateada) {
            select.value = marcaFormateada;
            select.dispatchEvent(new Event('change'));
            if (typeof cargarTablaInventarioAdmin === 'function') cargarTablaInventarioAdmin();
            return true;
        }
    }
    return false;
}

// CORRECCIÓN SOLICITADA: La IA ahora también te rellena los campos para que los veas
async function procesarChatAdmin() {
    const inputField = document.getElementById("chat-admin-input");
    let texto = inputField.value + " "; 
    if (!texto.trim()) return;

    detectarYCambiarMarca(texto);

    let marcaActual = document.getElementById("marca-activa").value;
    let inventario = productosDB[marcaActual];

    if (navigator.onLine && typeof COHERE_API_KEY !== "undefined") {
        inputField.value = "⏳ Creando productos con IA...";
        inputField.disabled = true;

        try {
            const prompt = `Extrae los productos a agregar del siguiente texto: "${texto}".
            Si no menciona rendimiento, factor o medida, pon 1.
            Devuelve SOLO JSON estricto:
            {"productos": [{"codigo": "GEN-01", "categoria": "General", "nombre": "Nombre Prod", "detalle": "", "rendimiento": 2.2, "precio": 15}]}`;
            
            const res = await fetch("https://api.cohere.com/v1/chat", {
                method: "POST",
                headers: { "Authorization": `Bearer ${COHERE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ message: prompt, temperature: 0.1 })
            });

            if (res.ok) {
                const data = await res.json();
                let respuestaLimpia = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
                let jsonIA = JSON.parse(respuestaLimpia);
                let agregados = [];

                jsonIA.productos.forEach(p => {
                    if (p.categoria === "" || p.rendimiento === 1) {
                        let similitud = Object.keys(inventario).find(k => k.toLowerCase().includes(p.nombre.toLowerCase().split(" ")[0]) || p.nombre.toLowerCase().includes(k.toLowerCase().split(" ")[0]));
                        if (similitud && inventario[similitud]) {
                            if (p.categoria === "") p.categoria = inventario[similitud].categoria;
                            if (p.rendimiento === 1) p.rendimiento = inventario[similitud].rendimiento;
                            if (p.detalle === "") p.detalle = inventario[similitud].detalle;
                        }
                    }
                    
                    // Llenado dual: Llena la base de datos Y los campos visuales
                    inventario[p.nombre] = {
                        codigo: p.codigo || "NEW-AUTO", categoria: p.categoria || "General",
                        detalle: p.detalle || "Agregado por IA", rendimiento: p.rendimiento || 1,
                        precio: parseFloat(p.precio) || 0, descuento: 0
                    };
                    agregados.push(p.nombre);
                    
                    document.getElementById("inv-nom").value = p.nombre;
                    document.getElementById("inv-pre").value = p.precio;
                    document.getElementById("inv-rend").value = p.rendimiento;
                    document.getElementById("inv-cat").value = p.categoria;
                });

                window.appPOS.guardarCambiosMemoria();
                cargarTablaInventarioAdmin();
                
                inputField.disabled = false;
                inputField.value = "";
                document.getElementById("preview-admin-add").innerText = `✅ Creados/Actualizados (Marca: ${marcaActual}): ${agregados.join(", ")}`;
                setTimeout(() => document.getElementById("preview-admin-add").innerText = "", 5000);
                return; 
            }
        } catch(e) { console.warn("Cohere falló en Admin, usando Motor Local."); }
    }

    // Respaldo de llenado de campos local (Offline Regex de la versión 2 intacto)
    inputField.disabled = false;
    const matchPrecio = texto.match(/(?:precio|usd|\$)\s*[:=]?\s*(\d+[\.,]?\d*)/i);
    if (matchPrecio) document.getElementById("inv-pre").value = matchPrecio[1].replace(',', '.');

    const matchRend = texto.match(/(?:rendimiento|factor|medida)\s*[:=]?\s*(\d+[\.,]?\d*)/i);
    if (matchRend) document.getElementById("inv-rend").value = matchRend[1].replace(',', '.');

    const matchCod = texto.match(/(?:código|codigo|cod)\s*[:=]?\s*([A-Za-z0-9\-]+)/i);
    if (matchCod) document.getElementById("inv-cod").value = matchCod[1].toUpperCase();

    function extraer(regexArr) {
        for (let r of regexArr) {
            let m = texto.match(r);
            if (m) return m[1].trim().replace(/,$/, "");
        }
        return "";
    }
    const cat = extraer([/(?:categoria|categoría)\s*[:=]?\s*(.*?)(?=\s*(?:codigo|código|nombre|detalle|factor|medida|precio|$))/i]);
    if (cat) document.getElementById("inv-cat").value = cat;

    const nom = extraer([/(?:nombre|producto)\s*[:=]?\s*(.*?)(?=\s*(?:codigo|código|categoria|categoría|detalle|factor|medida|precio|$))/i]);
    if (nom) document.getElementById("inv-nom").value = nom;

    document.getElementById("preview-admin-add").innerText = `✔ Formulario rellenado localmente. Revisa y haz clic en Guardar Manual.`;
    inputField.value = "";
    setTimeout(() => document.getElementById("preview-admin-add").innerText = "", 4000);
}

function procesarChatPrecios() {
    let texto = document.getElementById("chat-precios-input").value.toLowerCase();
    if (!texto.trim()) return;

    detectarYCambiarMarca(texto);

    let marcaActual = document.getElementById("marca-activa").value;
    let inventario = productosDB[marcaActual];
    if (!inventario) return;

    let actualizados = [];
    let fragmentos = texto.split(/ y |,| además | ademas /);

    fragmentos.forEach(frag => {
        let nombreMatch = buscarProductoPreciso(frag, inventario);
        
        if (nombreMatch) {
            let productoModificado = false;
            
            const matchPrecio = frag.match(/(?:precio|usd|\$)\s*(?:a|en)?\s*(\d+[\.,]?\d*)/i);
            if (matchPrecio) {
                inventario[nombreMatch].precio = parseFloat(matchPrecio[1].replace(',', '.'));
                productoModificado = true;
            } else {
                const soloNumero = frag.replace(nombreMatch.toLowerCase(), "").match(/(\d+[\.,]?\d*)/g);
                if (soloNumero && !frag.includes("factor") && !frag.includes("medida") && !frag.includes("detalle")) {
                    inventario[nombreMatch].precio = parseFloat(soloNumero[soloNumero.length - 1].replace(',', '.'));
                    productoModificado = true;
                }
            }

            const matchRend = frag.match(/(?:factor|medida)\s*(?:a|en)?\s*(\d+[\.,]?\d*)/i);
            if (matchRend) {
                inventario[nombreMatch].rendimiento = parseFloat(matchRend[1].replace(',', '.'));
                productoModificado = true;
            }

            if (productoModificado && !actualizados.includes(nombreMatch)) {
                actualizados.push(nombreMatch);
            }
        }
    });

    if (actualizados.length > 0) {
        window.appPOS.guardarCambiosMemoria();
        cargarTablaInventarioAdmin(); 
        
        const msgBox = document.getElementById("preview-admin-prices");
        msgBox.innerText = `✅ Modificado precisión exacta: ${actualizados.join(", ")}`;
        document.getElementById("chat-precios-input").value = "";
        setTimeout(() => msgBox.innerText = "", 6000);
    } else {
        alert("🤖 No se encontró el producto exacto. Escribe al menos 2 palabras clave, ej: 'precio en 10 a piso vinil click'.");
    }
}

function procesarChatDescuentos() {
    let texto = document.getElementById("chat-descuentos-input").value.toLowerCase();
    if (!texto.trim()) return;

    detectarYCambiarMarca(texto);

    let marcaActual = document.getElementById("marca-activa").value;
    let inventario = productosDB[marcaActual];
    if (!inventario) return;

    let actualizados = [];
    let limpiarTodo = texto.includes("ya no hay promociones") || texto.includes("quitar todos los descuentos") || texto.includes("borrar descuentos");

    if (limpiarTodo) {
        Object.keys(inventario).forEach(nom => {
            if (inventario[nom].descuento > 0) {
                inventario[nom].descuento = 0;
                actualizados.push(nom);
            }
        });
        document.getElementById("preview-admin-descuentos").innerText = `🧹 Se eliminaron todas las promociones de la marca ${marcaActual}.`;
    } else {
        let quitarPuntual = texto.includes("ya no hay descuento en") || texto.includes("se acabo la promocion en") || texto.includes("ya no hay promocion en") || texto.includes("quitar descuento a");
        let fragmentos = texto.split(/ y |,| además /);

        fragmentos.forEach(frag => {
            let nombreMatch = buscarProductoPreciso(frag, inventario);
            
            if (nombreMatch) {
                if (quitarPuntual) {
                    inventario[nombreMatch].descuento = 0;
                    if (!actualizados.includes(nombreMatch)) actualizados.push(`Removido: ${nombreMatch}`);
                } else {
                    let matchPromoPrecio = frag.match(/(?:precio de promoción|precio promocional|promoción)\s*(?:de|en)?\s*([\d.]+)\s*(?:usd|\$|dólares|dolares)/i);
                    if (matchPromoPrecio) {
                        let precioPromo = parseFloat(matchPromoPrecio[1].replace(',', '.'));
                        let precioBase = inventario[nombreMatch].precio;
                        if (precioBase > 0 && precioPromo > 0 && precioPromo < precioBase) {
                            let descuentoCalculado = ((precioBase - precioPromo) / precioBase) * 100;
                            descuentoCalculado = Math.round(descuentoCalculado * 100) / 100;
                            inventario[nombreMatch].descuento = descuentoCalculado;
                            if (!actualizados.includes(nombreMatch)) actualizados.push(`${descuentoCalculado}% (promoción $${precioPromo.toFixed(2)}) a ${nombreMatch}`);
                        } else {
                            alert(`El precio de promoción (${precioPromo}) debe ser menor al precio base (${precioBase}) para ${nombreMatch}. No se aplicó.`);
                        }
                    } else {
                        const matchDesc = frag.match(/(\d+)\s*%\s*de\s*descuento/i) || frag.match(/descuento.*(\d+)\s*%/i) || frag.match(/(\d+)\s*%/i);
                        if (matchDesc) {
                            inventario[nombreMatch].descuento = parseFloat(matchDesc[1]);
                            if (!actualizados.includes(nombreMatch)) actualizados.push(`${matchDesc[1]}% a ${nombreMatch}`);
                        }
                    }
                }
            }
        });
        if(actualizados.length > 0){
             document.getElementById("preview-admin-descuentos").innerText = `✅ Modificado exacto en ${marcaActual}: ${actualizados.join(" | ")}`;
        }
    }

    if (actualizados.length > 0 || limpiarTodo) {
        window.appPOS.guardarCambiosMemoria();
        cargarTablaInventarioAdmin(); 
        document.getElementById("chat-descuentos-input").value = "";
        setTimeout(() => document.getElementById("preview-admin-descuentos").innerText = "", 6000);
    } else {
        alert("🤖 No encontré el producto exacto. Usa palabras clave completas como: '15% a piso vinil SPC' o 'precio de promoción de piso vinil en 12 usd'.");
    }
}

// CORRECCIÓN SOLICITADA: Respeto estricto del selector de Marca en la Pestaña Eliminar
function cargarTablaEliminar() {
    const marca = document.getElementById("marca-activa").value;
    const inventario = productosDB[marca] || {};
    const tbody = document.getElementById("tbody-eliminar");
    const label = document.getElementById("marca-eliminar-label");
    
    if (label) label.textContent = marca;
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (Object.keys(inventario).length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#7f8fa6;">No hay productos en la marca ${marca}.</td></tr>`;
        return;
    }
    
    Object.keys(inventario).forEach(nom => {
        const p = inventario[nom];
        const tr = document.createElement("tr");
        const nombreEscapado = nom.replace(/'/g, "\\'");
        tr.innerHTML = `
            <td>${p.codigo}</td>
            <td style="text-align:left; font-weight:bold; color:var(--color-acento);">${nom}</td>
            <td style="color:#27ae60;">$${p.precio.toFixed(2)}</td>
            <td>
                <button class="btn-del" style="padding: 4px 10px; font-size: 11px;" onclick="eliminarProducto('${nombreEscapado}')">
                    ❌ Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarProducto(nombre) {
    if (!confirm(`¿Seguro que deseas eliminar el producto "${nombre}" de la marca actual?`)) return;
    
    const marca = document.getElementById("marca-activa").value;
    if (!productosDB[marca] || !productosDB[marca][nombre]) {
        alert("Producto no encontrado.");
        return;
    }
    
    delete productosDB[marca][nombre];
    window.appPOS.guardarCambiosMemoria();
    
    cargarTablaInventarioAdmin();
    cargarTablaEliminar();
}

function eliminarTodosProductos() {
    const marca = document.getElementById("marca-activa").value;
    const count = Object.keys(productosDB[marca] || {}).length;
    if (count === 0) {
        alert("No hay productos en esta marca para eliminar.");
        return;
    }
    
    if (!confirm(`⚠️ Esta acción eliminará TODOS los ${count} productos de la marca "${marca}". ¿Estás seguro?`)) return;
    if (!confirm("Última oportunidad: ¿Realmente quieres vaciar todo el catálogo de esta marca?")) return;
    
    productosDB[marca] = {};
    window.appPOS.guardarCambiosMemoria();
    
    cargarTablaInventarioAdmin();
    cargarTablaEliminar();
}