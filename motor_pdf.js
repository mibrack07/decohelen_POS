function getBase64Image(url) {
    return new Promise((resolve) => {
        let img = new Image(); img.crossOrigin = 'Anonymous';
        img.onload = () => {
            let canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => resolve(null); 
        img.src = url;
    });
}

async function generarPresupuesto() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'letter');
    
    const cliente = document.getElementById("cli-nombre").value;
    const numRif = document.getElementById("cli-rif").value;
    const tipoDoc = document.getElementById("cli-tipo-doc").value;
    const rif = (tipoDoc + numRif).toUpperCase();
    const tel = document.getElementById("cli-tel").value;
    const correo = document.getElementById("cli-correo").value;
    const dir = document.getElementById("cli-dir").value;
    const pago = document.getElementById("cli-pago").value;
    const numFactura = "P-" + String(localStorage.getItem("siguiente_factura")).padStart(5, '0');
    
    const d = new Date();
    const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
    const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    if (!cliente || itemsCarrito.length === 0) { alert("Agregue un cliente y productos al presupuesto."); return; }

    if (numRif) {
        clientesDB[rif] = { nombre: cliente, correo: correo, direccion: dir, tel: tel };
        localStorage.setItem("clientes_db", JSON.stringify(clientesDB));
    }

    const logoBase = await getBase64Image('./IMAGENES/logo_2.jpeg');
    const foto1 = await getBase64Image('./IMAGENES/foto1.jpg');
    const foto2 = await getBase64Image('./IMAGENES/foto2.jpg');
    const foto3 = await getBase64Image('./IMAGENES/foto3.jpg');
    const foto4 = await getBase64Image('./IMAGENES/foto4.jpg');
    const logoDeco = await getBase64Image('./IMAGENES/DecoArt logo.jpg');
    const logoAbrusci = await getBase64Image('./IMAGENES/abrusci logo.jpg');

    let xOffset = 30;
    [foto1, foto2, foto3, foto4].forEach(f => {
        if (f) doc.addImage(f, 'JPEG', xOffset, 20, 110, 75);
        xOffset += 110;
    });
    if (logoBase) doc.addImage(logoBase, 'JPEG', 470, 20, 110, 75);

    let yEmpresa = 120;
    doc.setFont("Helvetica", "bold"); doc.setFontSize(10);
    doc.text("DECOHELEN CA DISEÑOS Y PROYECTOS", 30, yEmpresa);
    doc.setFont("Helvetica", "normal"); doc.setFontSize(8);
    doc.text("persianas-cocinas- vestier-pisos laminados-paredes 3D-puertas de baño", 30, yEmpresa + 12);
    doc.text("RIF: 40040571-8 | Sistema de Ventas Automatizado", 30, yEmpresa + 24);
    doc.text("Dirección: Urb. Sabana Larga Calle 128-A. CC. Mediterrranean Plaza. PB-L18", 30, yEmpresa + 36);

    doc.setFont("Helvetica", "bold"); doc.setFontSize(12);
    doc.setTextColor(39, 60, 117); doc.text("PRESUPUESTO N°", 410, yEmpresa + 15);
    doc.setTextColor(255, 0, 0); doc.text(numFactura, 520, yEmpresa + 15);
    doc.setTextColor(0, 0, 0);

    let yCli = 190;
    doc.setFontSize(9); doc.setFont("Helvetica", "bold");
    doc.text("Razón Social / Nombre:", 30, yCli); doc.text("RIF / C.I.:", 30, yCli + 15); doc.text("Fecha Emisión:", 30, yCli + 30);
    doc.setFont("Helvetica", "normal");
    doc.text(cliente.toUpperCase(), 160, yCli); doc.text(rif, 160, yCli + 15); doc.text(fecha, 160, yCli + 30);

    doc.setFont("Helvetica", "bold");
    doc.text("Teléfono:", 350, yCli); doc.text("E-mail:", 350, yCli + 15); doc.text("Dirección:", 350, yCli + 30);
    doc.setFont("Helvetica", "normal");
    doc.text(tel, 410, yCli); doc.text(correo, 410, yCli + 15); doc.text(dir.toUpperCase().substring(0, 30), 410, yCli + 30);

    let yTab = 250;
    doc.setFillColor(27, 79, 44); doc.rect(30, yTab - 10, 550, 15, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("Helvetica", "bold");
    doc.text("CÓDIGO", 35, yTab); doc.text("PRODUCTO", 95, yTab); doc.text("ESPECIFICACIÓN", 245, yTab);
    doc.text("CAJAS", 355, yTab); doc.text("MEDIDA", 390, yTab); doc.text("PRECIO U.", 435, yTab); doc.text("TOTAL ITEM", 500, yTab);
    doc.setTextColor(0, 0, 0);
    
    let yItem = yTab + 15;
    itemsCarrito.forEach(item => {
        doc.setFont("Helvetica", "normal");
        let lineasNombre = doc.splitTextToSize(item.nombre, 140);
        let lineasDetalle = doc.splitTextToSize(item.detalle, 100);
        let maxLineas = Math.max(lineasNombre.length, lineasDetalle.length, 1);

        doc.text(item.codigo, 35, yItem); 
        doc.text(lineasNombre, 95, yItem);
        doc.text(lineasDetalle, 245, yItem); 
        doc.text(String(item.cajas), 365, yItem);
        doc.text(String(item.m2), 390, yItem); 
        doc.text(`$${item.precio.toFixed(2)}`, 435, yItem);
        doc.text(`$${item.total.toFixed(2)}`, 500, yItem);
        
        yItem += (maxLineas * 10) + 4; 
    });
    doc.setLineWidth(0.5); doc.line(30, yItem + 5, 580, yItem + 5);

    let { totalUsd, totalBs, tasa } = actualizarTotalGeneral();
    yItem += 25;
    
    doc.setFont("Helvetica", "bold"); doc.setFontSize(12);
    doc.text("TOTAL GENERAL:", 360, yItem); doc.text(`$${totalUsd.toFixed(2)}`, 500, yItem);
    doc.setFontSize(11); doc.text("TOTAL USDT:", 415, yItem + 20); doc.text(`USDT ${totalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}`, 500, yItem + 20);

    let yTerms = yItem + 65;
    doc.setFontSize(9); doc.setFont("Helvetica", "bold"); doc.text("TÉRMINOS Y CONDICIONES DE PAGO:", 30, yTerms);
    doc.setFont("Helvetica", "normal"); doc.setFontSize(8);
    doc.text("1. Mano de obra: Se cancela el 50% por anticipado y el 50% al culminar.", 30, yTerms + 15);
    doc.text("2. Materiales: Pago del 100% por adelantado para procesar pedido.", 30, yTerms + 27);
    doc.text("3. Presupuesto válido por 15 días continuos a partir de su emisión.", 30, yTerms + 39);
    doc.setFont("Helvetica", "italic"); doc.text(`Tasa de referencia calculada a: ${tasa.toFixed(2)} Bs.`, 30, yTerms + 55);

    doc.setFont("Helvetica", "bold"); doc.setFontSize(9); doc.text(`MÉTODO DE PAGO: ${pago}`, 350, yTerms);
    doc.setFont("Helvetica", "normal");
    doc.text(`[${pago.includes("Efectivo") ? "X" : " "}] Efectivo (Divisas)`, 360, yTerms + 15);
    doc.text(`[${pago.includes("Transf") || pago.includes("Pago") ? "X" : " "}] Transferencia / Pago Móvil`, 360, yTerms + 27);
    doc.text(`[${pago.includes("Zelle") || pago.includes("Binance") ? "X" : " "}] Zelle / Binance`, 360, yTerms + 39);

    let yFirmas = yTerms + 100;
    doc.setLineWidth(1); doc.line(50, yFirmas, 250, yFirmas); doc.line(350, yFirmas, 550, yFirmas);
    doc.setFont("Helvetica", "bold"); doc.setFontSize(9);
    doc.text("Firma del Asesor", 100, yFirmas + 15); doc.text("Firma del Cliente (Aceptación)", 390, yFirmas + 15);

    if (logoDeco) doc.addImage(logoDeco, 'JPEG', 30, yFirmas + 30, 90, 35);
    if (logoAbrusci) doc.addImage(logoAbrusci, 'JPEG', 140, yFirmas + 30, 90, 35);

    // ✨ LÓGICA RECUPERADA MEJORADA DE LA V1: GUARDADO AUTOMÁTICO DE PRODUCTOS EXPRESS ✨
    let marcaActual = document.getElementById("marca-activa").value;
    let catalogoModificado = false;
    
    itemsCarrito.forEach(item => {
        if (item.codigo && item.codigo.startsWith("TEMP") && item.codigo !== "SRV-EXT") {
            if (!productosDB[marcaActual]) productosDB[marcaActual] = {};
            let nombreLimpio = item.nombre.replace(/\s*\(-[\d.]+\%\)$/, "").trim();
            
            let factorRecuperado = 1.0;
            let matchFactor = item.detalle.match(/Factor:\s*(\d+[\.,]?\d*)/i);
            if (matchFactor) factorRecuperado = parseFloat(matchFactor[1]);

            let detalleLimpio = item.detalle.replace(/\| Factor:.*/i, '').replace(/.*U\.M\./i, '').trim() || "Ingresado Express";

            productosDB[marcaActual][nombreLimpio] = {
                codigo: "NEW-" + Math.floor(Math.random() * 10000),
                categoria: "Agregado Express",
                detalle: detalleLimpio,
                rendimiento: factorRecuperado,
                precio: item.precio,
                descuento: 0,
                stock: 100
            };
            catalogoModificado = true;
        }
    });

    if (catalogoModificado) {
        window.appPOS.guardarCambiosMemoria();
        if(typeof cargarTablaInventarioAdmin === 'function') cargarTablaInventarioAdmin();
    }

    doc.save(`${numFactura}_${cliente.replace(/\s+/g, '_')}.pdf`);

    let historial = JSON.parse(localStorage.getItem("historial_ventas") || "[]");
    historial.push({ fecha: fecha, hora: hora, factura: numFactura, cliente: cliente, rif: rif, usd: totalUsd, bs: totalBs });
    localStorage.setItem("historial_ventas", JSON.stringify(historial));
    localStorage.setItem("siguiente_factura", String(parseInt(localStorage.getItem("siguiente_factura")) + 1));

    if (tel && confirm("¿Deseas enviar el PDF por WhatsApp?")) {
        let msg = `Hola ${cliente}, adjunto envío tu presupuesto formal ${numFactura}.`;
        window.open(`https://wa.me/58${tel.replace(/^0+/, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    
    limpiarFormulario();
}