function crearExcelPro(nombreArchivo = "sistema_ventas_decoroyal_v6_ACTUALIZADA.xlsx") {
    const wb = XLSX.utils.book_new();

    // 1. CREACIÓN AUTOMÁTICA DE LAS 3 PESTAÑAS (MARCAS)
    ["Dekomundo", "Dokka", "Castell"].forEach(marca => {
        let inventarioMarca = productosDB[marca] || {};
        let invData = [["Código", "Categoría", "Nombre del Producto", "Detalle", "Rendimiento", "Precio Unitario", "Stock"]];
        
        Object.keys(inventarioMarca).forEach(nom => {
            let p = inventarioMarca[nom];
            invData.push([p.codigo, p.categoria, nom, p.detalle, p.rendimiento, p.precio, p.stock || 100]);
        });
        
        const wsInv = XLSX.utils.aoa_to_sheet(invData);
        // Agrega la pestaña con el nombre exacto de la marca
        XLSX.utils.book_append_sheet(wb, wsInv, marca);
    });

    // 2. CREACIÓN DE LA PESTAÑA DE PRESUPUESTO (Usando la marca activa como base)
    let marcaActual = document.getElementById("marca-activa").value; 
    let presData = [
        ["", "SUMINISTROS DECOHELEN C.A.", "", "", "", "", "", "PRESUPUESTO"], 
        [], [],
        ["", "Razón Social / Nombre:", "", "", "", "Teléfono:"], 
        ["", "RIF / C.I.:", "", "", "", "Método de Pago:"], 
        [], [], []
    ];
    presData.push(["Código", "Categoría", "Nombre del Producto", "Detalle", "Cajas", "M2 Totales", "Precio Unit.", "Total Item"]);
    
    // Fórmulas automáticas de Excel apuntando a la pestaña de la marca que estabas usando
    for(let r = 11; r <= 25; r++){
        presData.push([
            { f: `IF(C${r}="","",INDEX(${marcaActual}!A:A,MATCH(C${r},${marcaActual}!C:C,0)))` },
            "", "", "", "", 
            { f: `IF(C${r}="","",E${r}*INDEX(${marcaActual}!E:E,MATCH(C${r},${marcaActual}!C:C,0)))` },
            { f: `IF(C${r}="","",INDEX(${marcaActual}!F:F,MATCH(C${r},${marcaActual}!C:C,0)))` },
            { f: `IF(C${r}="","",F${r}*G${r})` }
        ]);
    }
    presData.push([]);
    presData.push(["", "", "", "", "", "", "TOTAL GENERAL", { f: "SUM(H11:H25)" }]);

    const wsPres = XLSX.utils.aoa_to_sheet(presData);
    wsPres['!cols'] = [{wch: 15}, {wch: 20}, {wch: 35}, {wch: 25}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsPres, "Presupuesto");

    // 3. DESCARGA SILENCIOSA DEL ARCHIVO
    XLSX.writeFile(wb, nombreArchivo);
}