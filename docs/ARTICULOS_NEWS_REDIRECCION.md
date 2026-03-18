# Lógica de artículos (News) y redirección al URL del artículo

Describe cómo funcionan los artículos/noticias en la sección de noticias del landing y cómo se redirige al usuario al URL del artículo (ej. LinkedIn, blog externo).

---

## 1. Dónde está implementado

- **Componente:** `src/components/NewsSection.tsx`
- **Uso:** sección "Noticias y Actualizaciones" en la landing (`src/pages/landing.tsx`).
- **Datos:** por ahora los artículos están en estado local (`useState`). Cada artículo tiene un campo **URL** al que redirigir.

---

## 2. Modelo de un artículo

Cada artículo (tipo `NewsPost`) tiene al menos:

| Campo | Tipo | Uso |
|-------|------|-----|
| `id` | string | Identificador único. |
| `title` | string | Título del artículo. |
| `excerpt` | string | Resumen o descripción corta. |
| `author` | string | Nombre del autor. |
| `authorAvatar` | string | URL de la foto del autor. |
| `company` | string | Medio o empresa (ej. "TechCrunch México"). |
| `publishDate` | string | Fecha de publicación (ej. "2024-01-15"). |
| **`linkedinUrl`** | **string** | **URL del artículo.** Es la URL a la que se redirige al hacer clic en la tarjeta o en "Ver en LinkedIn". Puede ser un post de LinkedIn, un artículo en blog, etc. |
| `engagement` | object | `{ likes, comments, shares }` (números). |
| `category` | string | Categoría (ej. "Tecnología", "Marketing"). |
| `image` | string (opcional) | URL de la imagen destacada. |
| `isTrending` | boolean (opcional) | Si se muestra el badge "Trending". |

El campo que define la redirección es **`linkedinUrl`**: debe ser una URL absoluta (http o https) del artículo o del post externo.

---

## 3. Lógica de redirección

### 3.1 Qué hace la app al hacer clic

1. **Clic en la tarjeta (imagen, título, autor, excerpt, métricas):**  
   Se llama a `handleArticleClick(post.linkedinUrl)` → se abre `post.linkedinUrl` en **nueva pestaña** (`window.open(url, '_blank', 'noopener,noreferrer')`).

2. **Clic en el botón "Ver en LinkedIn":**  
   Mismo comportamiento: se abre `post.linkedinUrl` en nueva pestaña.  
   Se usa `e.stopPropagation()` en el botón para que no se dispare también el click de la tarjeta (evitar doble apertura).

### 3.2 Validación de la URL

- Solo se abre si el valor es un string no vacío y que empiece por `http://` o `https://`.
- Si no hay URL o no es válida, no se hace nada (no se abre ventana).

### 3.3 Código de referencia (app / otra plataforma)

En la app (web o móvil) puedes implementar:

- **Al tocar el artículo (tarjeta completa o botón):**  
  - Leer la URL del artículo (en nuestro caso `linkedinUrl`).  
  - Si es válida (http/https), abrirla en navegador externo o WebView.

Ejemplo genérico:

```ts
function openArticleUrl(url: string | undefined): void {
  if (!url?.trim()) return;
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) {
    window.open(u, '_blank', 'noopener,noreferrer'); // web
    // En app nativa: Linking.openURL(u) (React Native) o equivalente.
  }
}
```

---

## 4. Resumen para la app

| Acción del usuario | Comportamiento |
|--------------------|----------------|
| Clic en la tarjeta (imagen, título, autor, texto, engagement) | Abrir `article.linkedinUrl` en nueva pestaña. |
| Clic en "Ver en LinkedIn" | Abrir `article.linkedinUrl` en nueva pestaña (mismo URL). |
| Filtros (categoría, orden) | Solo filtran/ordenan la lista; la redirección siempre usa `linkedinUrl` del artículo elegido. |

Cada artículo debe tener **una URL de destino** (`linkedinUrl` en el código actual). Esa URL puede ser de LinkedIn, un blog, una noticia externa, etc.; la lógica de redirección es la misma: abrir esa URL al hacer clic en el artículo o en el botón.
