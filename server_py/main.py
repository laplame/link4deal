from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import io
import base64
from typing import Optional, List
import logging
from datetime import datetime
import json

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title="Link4Deal OCR Service",
    description="Servicio de OCR para procesamiento de imágenes de promociones",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración
API_KEY = os.getenv("OCR_API_KEY", "default-key")
OCR_ENGINE = os.getenv("OCR_ENGINE", "tesseract")
LANGUAGE = os.getenv("OCR_LANGUAGE", "spa+eng")

# Verificar API key
async def verify_api_key(x_api_key: str = Header(None)):
    if not x_api_key or x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="API key inválida o faltante"
        )
    return x_api_key

# ===== RUTAS =====

@app.get("/")
async def root():
    """Endpoint raíz del servicio"""
    return {
        "message": "Link4Deal OCR Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Verificar salud del servicio"""
    try:
        # Aquí se pueden agregar verificaciones adicionales
        # como conexión a bases de datos, servicios externos, etc.
        
        return {
            "status": "healthy",
            "service": "ocr-service",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "ocr_engine": OCR_ENGINE,
            "language": LANGUAGE
        }
    except Exception as e:
        logger.error(f"Error en health check: {e}")
        raise HTTPException(status_code=500, detail="Error en health check")

@app.post("/ocr/process")
async def process_ocr(
    image: UploadFile = File(...),
    language: Optional[str] = None,
    ocr_engine: Optional[str] = None,
    scale: Optional[bool] = True,
    contrast: Optional[bool] = True,
    api_key: str = Depends(verify_api_key)
):
    """
    Procesar imagen con OCR
    
    Args:
        image: Archivo de imagen a procesar
        language: Idioma para OCR (default: spa+eng)
        ocr_engine: Motor de OCR a usar
        scale: Si aplicar escalado de imagen
        contrast: Si aplicar mejora de contraste
        api_key: API key para autenticación
    
    Returns:
        JSON con texto extraído y metadatos
    """
    try:
        logger.info(f"Procesando imagen: {image.filename}")
        
        # Validar tipo de archivo
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="El archivo debe ser una imagen"
            )
        
        # Leer contenido de la imagen
        image_content = await image.read()
        
        # Procesar OCR
        ocr_result = await process_image_ocr(
            image_content,
            language or LANGUAGE,
            ocr_engine or OCR_ENGINE,
            scale,
            contrast
        )
        
        logger.info(f"OCR completado para {image.filename}")
        
        return {
            "success": True,
            "message": "OCR procesado exitosamente",
            "data": ocr_result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error procesando OCR: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando OCR: {str(e)}"
        )

@app.post("/ocr/batch")
async def process_batch_ocr(
    images: List[UploadFile] = File(...),
    language: Optional[str] = None,
    api_key: str = Depends(verify_api_key)
):
    """
    Procesar múltiples imágenes con OCR
    
    Args:
        images: Lista de archivos de imagen
        language: Idioma para OCR
        api_key: API key para autenticación
    
    Returns:
        JSON con resultados de todas las imágenes
    """
    try:
        logger.info(f"Procesando lote de {len(images)} imágenes")
        
        results = []
        for i, image in enumerate(images):
            try:
                # Validar tipo de archivo
                if not image.content_type.startswith('image/'):
                    results.append({
                        "filename": image.filename,
                        "success": False,
                        "error": "Tipo de archivo no válido"
                    })
                    continue
                
                # Leer contenido
                image_content = await image.read()
                
                # Procesar OCR
                ocr_result = await process_image_ocr(
                    image_content,
                    language or LANGUAGE,
                    OCR_ENGINE,
                    True,
                    True
                )
                
                results.append({
                    "filename": image.filename,
                    "success": True,
                    "data": ocr_result
                })
                
            except Exception as e:
                logger.error(f"Error procesando imagen {image.filename}: {e}")
                results.append({
                    "filename": image.filename,
                    "success": False,
                    "error": str(e)
                })
        
        logger.info(f"Lote procesado: {len([r for r in results if r['success']])}/{len(images)} exitosos")
        
        return {
            "success": True,
            "message": f"Lote procesado: {len([r for r in results if r['success']])}/{len(images)} exitosos",
            "data": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error procesando lote: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando lote: {str(e)}"
        )

# ===== FUNCIONES DE PROCESAMIENTO =====

async def process_image_ocr(
    image_content: bytes,
    language: str,
    engine: str,
    scale: bool,
    contrast: bool
) -> dict:
    """
    Procesar imagen con OCR usando el motor especificado
    
    Args:
        image_content: Contenido de la imagen en bytes
        language: Idioma para OCR
        engine: Motor de OCR
        scale: Si aplicar escalado
        contrast: Si aplicar mejora de contraste
    
    Returns:
        Diccionario con resultados del OCR
    """
    try:
        # Por ahora, simulamos el procesamiento OCR
        # En producción, aquí se implementaría la lógica real
        
        # Simular extracción de texto
        extracted_text = simulate_ocr_extraction(image_content)
        
        # Calcular confianza simulada
        confidence = calculate_confidence(extracted_text)
        
        # Procesar metadatos
        metadata = extract_metadata(image_content)
        
        return {
            "text": extracted_text,
            "confidence": confidence,
            "language": language,
            "engine": engine,
            "metadata": metadata,
            "processing_time": 0.5,  # Simulado
            "word_count": len(extracted_text.split()),
            "character_count": len(extracted_text)
        }
        
    except Exception as e:
        logger.error(f"Error en procesamiento OCR: {e}")
        raise Exception(f"Error en procesamiento OCR: {str(e)}")

def simulate_ocr_extraction(image_content: bytes) -> str:
    """
    Simular extracción de texto OCR
    En producción, aquí se usaría pytesseract o similar
    """
    # Simular diferentes tipos de contenido basado en el tamaño de la imagen
    image_size = len(image_content)
    
    if image_size < 10000:  # Imagen pequeña
        return "Oferta especial\nDescuento 20%\nVálido hasta 31/12/2024"
    elif image_size < 50000:  # Imagen mediana
        return "Smartphone Samsung Galaxy S23\nPrecio: $24,999 MXN\nPrecio original: $29,999 MXN\nDescuento: 17%\nTienda: Samsung Store\nUbicación: CDMX"
    else:  # Imagen grande
        return "PROMOCIÓN ESPECIAL\n\nProducto: Laptop MacBook Pro 16\" M2 Pro\nMarca: Apple\nCategoría: Electrónicos\n\nPrecios:\n- Precio original: $109,999 MXN\n- Precio con descuento: $89,999 MXN\n- Ahorro: $20,000 MXN\n- Descuento: 18%\n\nEspecificaciones:\n- Procesador: Apple M2 Pro\n- Memoria: 16GB RAM\n- Almacenamiento: 512GB SSD\n- Pantalla: 16.2\" Liquid Retina XDR\n\nTienda: Apple Store\nUbicación: Santa Fe, CDMX\n\nTérminos y condiciones:\n- Válido hasta: 31/12/2024\n- Stock limitado\n- No acumulable con otras promociones\n- Envío gratis incluido"

def calculate_confidence(text: str) -> float:
    """
    Calcular nivel de confianza del OCR
    """
    if not text:
        return 0.0
    
    # Simular confianza basada en la calidad del texto
    word_count = len(text.split())
    char_count = len(text)
    
    # Fórmula simple para simular confianza
    base_confidence = min(95.0, 70.0 + (word_count * 0.5) + (char_count * 0.1))
    
    # Agregar variabilidad
    import random
    variation = random.uniform(-5.0, 5.0)
    
    return max(0.0, min(100.0, base_confidence + variation))

def extract_metadata(image_content: bytes) -> dict:
    """
    Extraer metadatos de la imagen
    """
    try:
        from PIL import Image
        import io
        
        # Abrir imagen desde bytes
        image = Image.open(io.BytesIO(image_content))
        
        return {
            "format": image.format,
            "mode": image.mode,
            "size": image.size,
            "width": image.width,
            "height": image.height,
            "dpi": image.info.get('dpi', None),
            "compression": image.info.get('compression', None)
        }
        
    except Exception as e:
        logger.warning(f"No se pudieron extraer metadatos: {e}")
        return {
            "format": "unknown",
            "size": len(image_content),
            "error": str(e)
        }

# ===== MANEJO DE ERRORES =====

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Manejar excepciones globales"""
    logger.error(f"Error no manejado: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Error interno del servidor",
            "error": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )

# ===== INICIO DEL SERVIDOR =====

if __name__ == "__main__":
    # Configuración del servidor
    host = os.getenv("OCR_HOST", "0.0.0.0")
    port = int(os.getenv("OCR_PORT", "8000"))
    
    logger.info(f"Iniciando servidor OCR en {host}:{port}")
    
    # Iniciar servidor
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
