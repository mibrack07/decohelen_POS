let productosDB = { "Dekomundo": {}, "Dokka": {}, "Castell": {} };
let clientesDB = JSON.parse(localStorage.getItem("clientes_db") || "{}");
let itemsCarrito = []; 
window.rolUsuario = "Vendedor";
window.itemSeleccionadoIndex = -1;

const COHERE_API_KEY = "GHBxZzzqICx3OveexKgm5QnfBiDBsbtGzbZOhx4d";

class GestorUSDT {
    async obtenerTasa() {
        try {
            const respuesta = await fetch("https://ve.dolarapi.com/v1/dolares");
            const datos = await respuesta.json();
            const tasaParalelo = datos.find(tasa => tasa.fuente === "paralelo");
            const tasaFormateada = parseFloat(tasaParalelo.promedio).toFixed(2);
            document.getElementById("tasa-bcv").value = tasaFormateada;
            return parseFloat(tasaFormateada);
        } catch (error) {
            document.getElementById("tasa-bcv").value = "36.50"; 
            return 36.50;
        }
    }
}

class SistemaPOS {
    constructor() {
        this.usdt = new GestorUSDT();
        this.descuentoGlobal = 0;
    }

    async iniciar() {
        await this.cargarBaseDatosMultimarca();
        await this.usdt.obtenerTasa();
        this.limpiarBackupsAntiguos();
        
        if (!localStorage.getItem("siguiente_factura")) localStorage.setItem("siguiente_factura", "1");
        if (!localStorage.getItem("admin_pass")) localStorage.setItem("admin_pass", "admin123");
        if (!localStorage.getItem("historial_ventas")) localStorage.setItem("historial_ventas", "[]");
        
        setTimeout(() => { if(typeof cargarTablaInventarioAdmin === 'function') cargarTablaInventarioAdmin(); }, 500);
    }

    async cargarBaseDatosMultimarca() {
        let excelCargadoExitosamente = false;

        // 1. INTENTO DE CARGA ONLINE: Buscar siempre la versión más fresca del repositorio
        try {
            const urlRaiz = window.location.origin + window.location.pathname.replace('index.html', '');
            
            // CORRECCIÓN APLICADA: Rutas actualizadas apuntando a BACKEND y versiones de respaldo
            const rutasPrueba = [
                './BACKEND/sistema_ventas_decoroyal_v6.xlsx?v=' + new Date().getTime(),
                `${urlRaiz}/BACKEND/sistema_ventas_decoroyal_v6.xlsx?v=${new Date().getTime()}`,
                './sistema_ventas_decoroyal_v6_4.xlsx?v=' + new Date().getTime(),
                './sistema_ventas_decoroyal_v6_7.xlsx?v=' + new Date().getTime()
            ];
            
            let bufferLeido = null;
            for (let ruta of rutasPrueba) {
                try {
                    // cache: 'no-store' obliga al navegador a saltarse la memoria caché
                    const response = await fetch(ruta, { cache: 'no-store' });
                    if (response.ok) {
                        bufferLeido = await response.arrayBuffer();
                        break; // Archivo encontrado y descargado
                    }
                } catch (err) { continue; } // Si falla esta ruta, intenta la siguiente
            }

            if (bufferLeido) {
                const wb = XLSX.read(bufferLeido, { type: 'array' });
                ["Dekomundo", "Dokka", "Castell"].forEach(marca => {
                    const ws = wb.Sheets[marca] || wb.Sheets[wb.SheetNames[0]]; 
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    let base = {};
                    for (let i = 1; i < data.length; i++) {
                        let row = data[i];
                        if (row[2]) { 
                            base[row[2]] = {
                                codigo: row[0] || "S/C", categoria: row[1] || "", 
                                detalle: row[3] || "", rendimiento: parseFloat(row[4]) || 1.0, 
                                precio: parseFloat(row[5]) || 0.0, stock: parseFloat(row[6]) || 100.0,
                                descuento: parseFloat(row[7]) || 0.0 
                            };
                        }
                    }
                    productosDB[marca] = base;
                });
                this.guardarCambiosMemoria(); // Guarda el excel fresco en memoria local
                excelCargadoExitosamente = true;
                console.log("✅ Catálogo actualizado exitosamente desde el servidor Netlify.");
            }
        } catch(e) { 
            console.warn("⚠️ No se pudo conectar al servidor para actualizar el Excel."); 
        }

        // 2. ESCUDO OFFLINE: Si no hay internet o falla el servidor, usar la memoria local
        if (!excelCargadoExitosamente) {
            let dbGuardada = localStorage.getItem("productos_db_multimarca");
            let backupEmergencia = localStorage.getItem("backup_emergencia");

            if (dbGuardada && dbGuardada !== "{}" && dbGuardada.length > 50) {
                productosDB = JSON.parse(dbGuardada);
                console.log("🔌 Modo Offline: Usando base de datos guardada en memoria local.");
            } else if (backupEmergencia && backupEmergencia !== "{}" && backupEmergencia.length > 50) {
                productosDB = JSON.parse(backupEmergencia);
                this.guardarCambiosMemoria();
            } else {
                console.warn("❌ No hay base de datos local ni en servidor. Requiere subir Excel manual.");
            }
        }
    }

    async cargarExcelManual() {
        const fileInput = document.getElementById("excel-upload");
        if (!fileInput.files.length) { alert("⚠️ Selecciona el Excel primero."); return; }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                
                ["Dekomundo", "Dokka", "Castell"].forEach(marca => {
                    const ws = wb.Sheets[marca] || wb.Sheets[wb.SheetNames[0]]; 
                    if(ws) {
                        const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        let base = {};
                        for (let i = 1; i < sheetData.length; i++) {
                            let row = sheetData[i];
                            if (row[2]) { 
                                base[row[2]] = {
                                    codigo: row[0] || "S/C", categoria: row[1] || "", 
                                    detalle: row[3] || "", rendimiento: parseFloat(row[4]) || 1.0, 
                                    precio: parseFloat(row[5]) || 0.0, stock: parseFloat(row[6]) || 100.0,
                                    descuento: parseFloat(row[7]) || 0.0 
                                };
                            }
                        }
                        productosDB[marca] = base;
                    }
                });
                
                this.guardarCambiosMemoria();
                if(typeof cargarTablaInventarioAdmin === 'function') cargarTablaInventarioAdmin();
                alert("¡Catálogo cargado con éxito desde tu archivo!");
                document.getElementById('modal-admin').classList.add('hidden'); 
            } catch (error) { alert("❌ Error al leer el archivo."); }
        };
        reader.readAsArrayBuffer(file);
    }

    guardarCambiosMemoria() {
        localStorage.setItem("productos_db_multimarca", JSON.stringify(productosDB));
        localStorage.setItem("backup_emergencia", JSON.stringify(productosDB));
        
        let backups = JSON.parse(localStorage.getItem("db_backups") || "[]");
        backups.push({ fecha: new Date().toISOString(), data: productosDB });
        if(backups.length > 10) backups.shift(); 
        localStorage.setItem("db_backups", JSON.stringify(backups));
    }

    limpiarBackupsAntiguos() {
        let backups = JSON.parse(localStorage.getItem("db_backups") || "[]");
        let sieteDiasAtras = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
        let filtrados = backups.filter(b => new Date(b.fecha).getTime() > sieteDiasAtras);
        localStorage.setItem("db_backups", JSON.stringify(filtrados));
    }

    detectarYCambiarMarca(texto) {
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

    async procesarComandoLocal() {
        const inputField = document.getElementById("chat-ia-input");
        const previewField = document.getElementById("preview-ventas");
        let texto = inputField.value;
        if (!texto.trim()) return;

        this.detectarYCambiarMarca(texto);

        texto = texto.toLowerCase();
        inputField.value = "⏳ Procesando orden con IA...";
        inputField.disabled = true;

        const marcaActiva = document.getElementById("marca-activa").value;
        let inventarioMarca = productosDB[marcaActiva] || {};
        let listaCatalogo = Object.keys(inventarioMarca).join(" | ");
        let procesado = false;
        let resumenItems = [];

        if (navigator.onLine && COHERE_API_KEY) {
            try {
                const promptCohere = `
                Actúas como un experto sistema POS. 
                El cliente dice: "${texto}".
                Catálogo ESTRICTO de la marca activa: [${listaCatalogo}].
                
                REGLAS:
                1. Asocia lo pedido con el "nombre_exacto" del catálogo. NO INVENTES NOMBRES.
                2. LÓGICA DE MEDIDA LIBRE: Si el cliente da DOS cantidades para un producto (Ej: "75 cajas que son 115 metros"), extrae AMBAS.
                   - "cajas_o_empaques": (Ej: 75)
                   - "medida_total_facturar": (Ej: 115)
                   Si solo da una cantidad, pon esa y la otra en 0. (Ej: "media" = 0.5, "un" = 1).
                3. Identifica la "unidad_medida" (m2, metros, cajas, litros, kg).
                4. Si pide SERVICIO (flete, instalación), pon "es_servicio": true y extrae su precio.
                5. Descuento global solo si dice explícitamente "descuento al total".
                
                Devuelve SOLO este JSON sin markdown:
                {
                  "items": [{"nombre_exacto": "Nombre exacto", "cajas_o_empaques": 75, "medida_total_facturar": 115, "unidad_medida": "m2", "es_servicio": false, "precio_servicio": 0}],
                  "descuento_porcentaje": 0
                }
                `;

                const res = await fetch("https://api.cohere.com/v1/chat", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${COHERE_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ message: promptCohere, temperature: 0.1 })
                });

                if (res.ok) {
                    const data = await res.json();
                    let respuestaLimpia = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
                    let jsonIA = JSON.parse(respuestaLimpia);

                    if (jsonIA.descuento_porcentaje > 0) {
                        if (window.rolUsuario === "Administrador") {
                            this.descuentoGlobal = jsonIA.descuento_porcentaje;
                            document.getElementById("txt-descuento").innerText = `(Descuento aplicado: ${this.descuentoGlobal}%)`;
                        } else { alert("🔒 Solo el Administrador puede aplicar descuentos."); }
                    }

                    jsonIA.items.forEach(item => {
                        if (item.nombre_exacto === "SRV-EXT" || item.es_servicio) {
                            let precioS = item.precio_servicio > 0 ? item.precio_servicio : 1; 
                            itemsCarrito.push({
                                cajas: 1, m2: 0, codigo: "SRV-EXT",
                                nombre: `Servicio Extra`, detalle: "Agregado por IA", 
                                precio: precioS, total: precioS
                            });
                            resumenItems.push(`Servicio`);
                            procesado = true;
                        } else if (inventarioMarca[item.nombre_exacto]) {
                            const prod = inventarioMarca[item.nombre_exacto];
                            let cajasCalc = parseFloat(item.cajas_o_empaques) || 0;
                            let finalCant = parseFloat(item.medida_total_facturar) || 0;
                            let unidadStr = item.unidad_medida ? item.unidad_medida.toLowerCase() : "unidades";
                            let textoDetalle = "";

                            if (cajasCalc > 0 && finalCant > 0) {
                                unidadStr = "U.M. (Libre)";
                                textoDetalle = `${cajasCalc} Empaques = ${finalCant} U.M. (Ajuste Libre)`;
                            } 
                            else {
                                let cantidadIngresada = cajasCalc > 0 ? cajasCalc : (finalCant > 0 ? finalCant : 1);

                                if (prod.rendimiento > 1) {
                                    let empaques = ["caja", "saco", "paila", "cuñete", "rollo", "galon", "unidad", "pieza", "kit"];
                                    let esEmpaque = empaques.some(emp => unidadStr.includes(emp)) || cajasCalc > 0;

                                    if (esEmpaque) {
                                        cajasCalc = cantidadIngresada;
                                        finalCant = parseFloat((cajasCalc * prod.rendimiento).toFixed(2));
                                        unidadStr = "U.M."; 
                                    } else {
                                        cajasCalc = Math.ceil(cantidadIngresada / prod.rendimiento);
                                        finalCant = parseFloat((cajasCalc * prod.rendimiento).toFixed(2));
                                    }
                                } else {
                                    cajasCalc = cantidadIngresada;
                                    finalCant = cantidadIngresada;
                                }
                                textoDetalle = `${finalCant} ${unidadStr} | Factor: ${prod.rendimiento}`;
                            }

                            let precioFinal = prod.precio;
                            let msgDescuento = "";
                            if (prod.descuento && prod.descuento > 0) {
                                precioFinal = prod.precio - (prod.precio * (prod.descuento / 100));
                                msgDescuento = `(-${prod.descuento}%)`;
                            }

                            itemsCarrito.push({
                                cajas: cajasCalc, m2: finalCant, codigo: prod.codigo, 
                                nombre: `${item.nombre_exacto} ${msgDescuento}`, detalle: textoDetalle, 
                                precio: precioFinal, total: parseFloat((finalCant * precioFinal).toFixed(2))
                            });
                            resumenItems.push(`${item.nombre_exacto} (${finalCant} U.M.)`);
                            procesado = true;
                        }
                    });
                }
            } catch(e) { console.warn("Cohere falló, activando motor offline estricto."); }
        }

        // MOTOR LOCAL (Respaldo 100% offline de la versión 2 intacto)
        if (!procesado) {
            const matchDescuento = texto.match(/(\d+)\s*%\s*de\s*descuento/i) || texto.match(/descuento.*(\d+)\s*%/i);
            if (matchDescuento) {
                if (window.rolUsuario === "Administrador") {
                    this.descuentoGlobal = parseFloat(matchDescuento[1]);
                    document.getElementById("txt-descuento").innerText = `(Descuento aplicado: ${this.descuentoGlobal}%)`;
                } else { alert("🔒 Acceso Denegado para descuentos."); }
                procesado = true;
            }

            const palabrasServicio = ["flete", "mano de obra", "instalación", "instalacion", "transporte", "desarme"];
            palabrasServicio.forEach(srv => {
                if (texto.includes(srv)) {
                    const matchPrecio = texto.split(srv)[1]?.match(/(\d+[\.,]?\d*)/);
                    if (matchPrecio) {
                        let precioSrv = parseFloat(matchPrecio[1].replace(',', '.'));
                        itemsCarrito.push({
                            cajas: 1, m2: 0, codigo: "SRV-EXT", nombre: `Servicio: ${srv.toUpperCase()}`, detalle: "Extraído local", precio: precioSrv, total: precioSrv
                        });
                        resumenItems.push(`Servicio ${srv}`);
                        procesado = true;
                    }
                }
            });

            let catalogoOrdenado = Object.keys(inventarioMarca).sort((a, b) => b.length - a.length);
            let textoRestante = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            catalogoOrdenado.forEach(nombre => {
                let nombreLimpio = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                let coincidencia = textoRestante.includes(nombreLimpio);
                
                if (!coincidencia) {
                    let palabrasNombre = nombreLimpio.split(" ").filter(p => p.length > 2);
                    let aciertos = 0;
                    palabrasNombre.forEach(p => { if (textoRestante.includes(p)) aciertos++; });
                    if (palabrasNombre.length > 0 && (aciertos / palabrasNombre.length >= 0.75)) coincidencia = true;
                }

                if (coincidencia) {
                    const textoAntes = textoRestante.split(nombreLimpio)[0] || textoRestante;
                    
                    let matchEmpaque = textoAntes.match(/(\d+[\.,]?\d*)\s*(caja|saco|paila|cuñete|rollo|galon|galón|unidad|und|pieza|pza|kit)s?/i);
                    let matchMedida = textoAntes.match(/(\d+[\.,]?\d*)\s*(m2|metro|ml|mm|cm|litro|lts|\bl\b|kg|kilo|gramo|oz)s?/i);

                    let cajasCalculadas = 0;
                    let cantidadFinal = 0;
                    let unidad = "unidad";
                    let textoDetalle = "";
                    const prod = inventarioMarca[nombre];

                    if (matchEmpaque && matchMedida) {
                        cajasCalculadas = parseFloat(matchEmpaque[1].replace(',', '.'));
                        cantidadFinal = parseFloat(matchMedida[1].replace(',', '.'));
                        unidad = "U.M. (Libre)";
                        textoDetalle = `${cajasCalculadas} Empaques = ${cantidadFinal} U.M. (Ajuste Libre)`;
                    } else {
                        const matchesNums = textoAntes.match(/(\d+[\.,]?\d*)/g);
                        let cantidad = matchesNums ? parseFloat(matchesNums[matchesNums.length - 1].replace(',', '.')) : 1;

                        if(textoAntes.match(/\by media\b|\bmedio\b/)) cantidad += 0.5;
                        if(textoAntes.match(/\bun\b|\buna\b/) && !matchesNums) cantidad = 1;
                        if(textoAntes.match(/\bpar\b|\bdos\b/) && !matchesNums) cantidad = 2;

                        if (textoAntes.match(/m2|metros cuadrados|m²/)) unidad = "m2";
                        else if (textoAntes.match(/ml|metros lineales/)) unidad = "ml";
                        else if (textoAntes.match(/mm|milimetros|milímetros/)) unidad = "mm";
                        else if (textoAntes.match(/cm|centimetros|centímetros/)) unidad = "cm";
                        else if (textoAntes.match(/\bm\b|metros|metro/)) unidad = "metros";
                        else if (textoAntes.match(/litros|litro|lts|\bl\b/)) unidad = "litros";
                        else if (textoAntes.match(/galon|galones|galón/)) unidad = "galones";
                        else if (textoAntes.match(/kg|kilos|kilogramos|kilo/)) unidad = "kg";
                        else if (textoAntes.match(/\bg\b|gramos|gramo/)) unidad = "gramos";
                        else if (textoAntes.match(/rollo|rollos/)) unidad = "rollos";
                        else if (textoAntes.match(/saco|sacos/)) unidad = "sacos";
                        else if (textoAntes.match(/paila|pailas/)) unidad = "pailas";
                        else if (textoAntes.match(/caja|cajas/)) unidad = "cajas";

                        if (prod.rendimiento > 1) {
                            let empaquesPrincipales = ["caja", "cajas", "saco", "sacos", "paila", "pailas", "cuñete", "cuñetes", "rollo", "rollos", "galon", "galones", "galón", "unidad", "unidades", "und", "piezas", "pieza", "pzas", "kit"];
                            let esEmpaque = empaquesPrincipales.includes(unidad);

                            if (esEmpaque) {
                                cajasCalculadas = cantidad;
                                cantidadFinal = parseFloat((cajasCalculadas * prod.rendimiento).toFixed(2));
                                unidad = "U.M."; 
                            } else {
                                cajasCalculadas = Math.ceil(cantidad / prod.rendimiento);
                                cantidadFinal = parseFloat((cajasCalculadas * prod.rendimiento).toFixed(2));
                            }
                        } else {
                            cajasCalculadas = cantidad;
                            cantidadFinal = cantidad;
                        }
                        textoDetalle = `${cantidadFinal} ${unidad} | Factor: ${prod.rendimiento}`;
                    }

                    let precioFinal = prod.precio;
                    let msgDescuento = "";
                    if (prod.descuento && prod.descuento > 0) {
                        precioFinal = prod.precio - (prod.precio * (prod.descuento / 100));
                        msgDescuento = `(-${prod.descuento}%)`;
                    }

                    itemsCarrito.push({
                        cajas: cajasCalculadas, m2: cantidadFinal, codigo: prod.codigo, 
                        nombre: `${nombre} ${msgDescuento}`, detalle: textoDetalle, 
                        precio: precioFinal, total: parseFloat((cantidadFinal * precioFinal).toFixed(2))
                    });
                    resumenItems.push(`${nombre}`);
                    
                    textoRestante = textoRestante.replace(nombreLimpio, "");
                    procesado = true;
                }
            });
        }

        inputField.disabled = false;
        inputField.value = "";
        inputField.focus();

        if (procesado) {
            this.actualizarUI();
            previewField.innerText = `✔ Agregados: ${resumenItems.join(", ")}`;
            setTimeout(() => previewField.innerText = "", 5000);
        } else {
            alert(`🤖 No logré asociar lo que pediste con el catálogo. Intenta ser un poco más exacto con el nombre.`);
        }
    }

    eliminarItemSeleccionado() {
        if (window.itemSeleccionadoIndex > -1) {
            itemsCarrito.splice(window.itemSeleccionadoIndex, 1);
            this.actualizarUI();
        } else { alert("Haz clic en una fila de la tabla para seleccionarla primero."); }
    }

    limpiarCarrito() {
        itemsCarrito = [];
        this.descuentoGlobal = 0;
        document.getElementById("txt-descuento").innerText = "";
        window.itemSeleccionadoIndex = -1;
        this.actualizarUI();
    }

    actualizarUI() {
        const tbody = document.querySelector("#tabla-carrito tbody");
        tbody.innerHTML = "";
        let totalUSD = 0;

        itemsCarrito.forEach((item, index) => {
            totalUSD += item.total;
            let tr = document.createElement("tr");
            tr.onclick = () => {
                document.querySelectorAll("#tabla-carrito tbody tr").forEach(r => r.classList.remove("selected"));
                tr.classList.add("selected");
                window.itemSeleccionadoIndex = index;
            };
            tr.innerHTML = `
                <td>${item.cajas}</td><td>${item.detalle}</td><td><span style="${item.codigo.startsWith('TEMP') ? 'color:#e84118; font-weight:bold;' : ''}">${item.codigo}</span></td>
                <td style="text-align: left; font-weight:bold;">${item.nombre}</td>
                <td>$${item.precio.toFixed(2)}</td><td>$${item.total.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        window.itemSeleccionadoIndex = -1;
        const totalFinalUsd = totalUSD - (totalUSD * (this.descuentoGlobal / 100));
        const tasa = parseFloat(document.getElementById("tasa-bcv").value) || 1;
        const totalUsdt = totalFinalUsd * tasa; 

        document.getElementById("total-general").innerText = 
            `Total: $${totalFinalUsd.toLocaleString('en-US', {minimumFractionDigits: 2})} | USDT ${totalUsdt.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
            
        return { totalUsd: totalFinalUsd, totalBs: totalUsdt, tasa };
    }
}

window.appPOS = new SistemaPOS();
document.addEventListener("DOMContentLoaded", () => window.appPOS.iniciar());

function checkLoginType() {
    document.getElementById("login-pass").disabled = (document.getElementById("login-usuario").value === "Vendedor");
}

function verificarLogin() {
    window.rolUsuario = document.getElementById("login-usuario").value; 
    if (window.rolUsuario === "Administrador") {
        if (document.getElementById("login-pass").value !== localStorage.getItem("admin_pass")) { alert("Contraseña incorrecta"); return; }
        document.getElementById("btn-panel-admin").classList.remove("hidden");
    } else { document.getElementById("btn-panel-admin").classList.add("hidden"); }
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    
    if(typeof cargarTablaInventarioAdmin === 'function') cargarTablaInventarioAdmin();
}

function cerrarSesion() { location.reload(); }
function actualizarTotalGeneral() { return window.appPOS.actualizarUI(); }
function limpiarFormulario() { window.appPOS.limpiarCarrito(); }