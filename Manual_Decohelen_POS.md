# 📘 Manual Operativo Definitivo: Decohelen POS Pro
**Versión:** 4.0 | **Motor:** NLP Regex Avanzado (100% Offline)

Este sistema cuenta con un motor local de reconocimiento que procesa las órdenes en milisegundos. **Todas las acciones se efectúan sobre la marca que indiques o la pestaña activa.**

---

## 📚 1. Diccionario de Acciones (Jerga Universal)
El sistema entiende múltiples formas de pedir una acción, adaptado a varios países:
*   **Vender / Carrito:** `agrega`, `añade`, `pon`, `dame`, `quiero`, `comprar`, `llevar`, `facturar`, `despachar`, `ingresar`, `suma`.
*   **Consultar Precios:** `precio`, `costo`, `cuanto`, `info`, `valor`.
*   **Descuentos:** `descuento`, `%`, `rebaja`, `promocion`, `oferta`, `abaratar`, `liquidar`, `ñapa`, `regateo`.
*   **Limpiar / Eliminar:** `quitar`, `eliminar`, `remover`, `borrar`, `desechar`, `suprimir`, `anular`, `descartar`, `raspar`.
*   **Actualizar / Modificar:** `actualiza`, `modificar`, `editar`, `ajustar`, `corregir`, `arreglar`, `cambiar`.
*   **Crear Producto:** `crear`, `nuevo`, `registrar`, `insertar`, `asentar`.

---

## 🛒 2. Agregar Productos del Catálogo
El sistema busca en tu Excel interno la coincidencia más exacta.
*   *"agrega 2 cajas de porcelanato dokka"*
*   *"dame 10 mallas mosaico"*
*   *"quiero 115 m2 de piso vinil"* (Medida exacta, el sistema hace el cálculo fraccionado automáticamente).

---

## ⚡ 3. Inserción Express y Creación Completa (Productos Nuevos)
Si el producto no existe en el catálogo, puedes crearlo al vuelo con TODOS sus datos (Medida, Factor y Precio) usando estas palabras clave en tu frase: **"medida"** y **"factor"**. El precio siempre va al final con "a", "por" o "en".

**Estructura ideal:**
`[Verbo] + [Cantidad] + [Nombre] + medida [Especificación] + factor [Número] + a [Precio]`

**Ejemplos de máximo poder:**
*   *"agrega 5 cajas de piso vinil spc medida 4mm click factor 2.22 a 18.5"*
*   *"crear un clavo de acero medida 2 pulgadas factor 1 a 0.50"*
*   *"pon un rodapié aluminio medida 2.4 metros a 10"* (Si omites el factor, el sistema asume 1).
*   *"dame un silicón a 5 usd"* (Si omites medida y factor, lo guarda con parámetros básicos).

*(Nota vital: Si usas esta estructura para "agregar", el producto entra a la factura. Al presionar "Generar PDF y Enviar", el sistema aprende este producto nuevo y lo guarda en tu base de datos para futuras ventas).*

---

## 🚚 4. Servicios y Fletes (No afectan stock)
Usa estas palabras exactas, seguido del precio: `flete`, `mano de obra`, `instalacion`, `transporte`, `desarme`.
*   *"agrega un flete por 45 usd"*

---

## 🏷️ 5. Mantenimiento del Catálogo (Solo Admin)
Puedes administrar todo desde el chat de la ventana de Administración.
*   **Aplicar Oferta:** *"ponle 15% de rebaja a la malla"*
*   **Actualizar Precio:** *"ajusta el precio del rodapié a 8 dólares"*
*   **Eliminar Registro:** *"elimina el porcelanato carrara del sistema"*