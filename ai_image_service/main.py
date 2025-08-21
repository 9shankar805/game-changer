import os
import io
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import cv2
import numpy as np
from PIL import Image
from fastapi import Request
from fastapi.responses import JSONResponse

# Initialize FastAPI app
app = FastAPI(title="Simple Image Processing Service", version="1.0.0")

# Configure CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add middleware for security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Handle preflight requests
    if request.method == "OPTIONS":
        response = JSONResponse(status_code=200, content={"status": "ok"})
    else:
        response = await call_next(request)
    
    # Add security headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    # Set Content Security Policy
    csp = """
        default-src 'self';
        connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws: wss:;
        img-src 'self' data: blob: http: https:;
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        font-src 'self' data:;
    """.strip().replace('\n', ' ')
    
    response.headers["Content-Security-Policy"] = csp
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    
    return response

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "AI Image Processing"}

# Global variables for models
esrgan_upsampler = None

def initialize_models():
    """Initialize AI models on startup"""
    global esrgan_upsampler
    
    try:
        # Initialize Real-ESRGAN model
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        esrgan_upsampler = RealESRGANer(
            scale=4,
            model_path='https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
            dni_weight=None,
            model=model,
            tile=0,
            tile_pad=10,
            pre_pad=0,
            half=False,  # Set to True if you have a powerful GPU
            gpu_id=None
        )
        print("✅ AI models initialized successfully")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize Real-ESRGAN: {e}")
        print("The service will work but without upscaling enhancement")

@app.on_event("startup")
async def startup_event():
    print("🚀 Server is starting...")

@app.get("/")
async def root():
    return {
        "message": "AI Image Processing Service",
        "version": "1.0.0",
        "features": ["Background Removal", "Image Enhancement", "Upscaling"],
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models": {
            "background_removal": "rembg (u2net)",
            "upscaling": "Real-ESRGAN" if esrgan_upsampler is not None else "unavailable"
        }
    }

def remove_background(image: Image.Image) -> Image.Image:
    """
    Remove background from image using rembg (U²-Net based).
    Automatically handles model downloading and GPU acceleration if available.
    Returns an RGBA image with transparency.
    """
    try:
        print("🚀 Starting background removal...")
        
        # Check if rembg is installed
        try:
            from rembg import remove, new_session
            import torch
        except ImportError as import_error:
            print("❌ Error: Required packages not found. Please install with:")
            print("pip install rembg[gpu] torch torchvision torchaudio")
            print(f"Import error details: {str(import_error)}")
            raise
        
        # Print CUDA availability
        cuda_available = torch.cuda.is_available()
        print(f"💻 CUDA available: {cuda_available}")
        if cuda_available:
            print(f"🎮 GPU: {torch.cuda.get_device_name(0)}")
        
        # Convert PIL image to RGB if it's not already
        if image.mode != 'RGB':
            print(f"🔄 Converting image from {image.mode} to RGB")
            image = image.convert('RGB')
        
        # Save image to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()
        
        print("📥 Initializing U²-Net model (this may take a moment on first run)...")
        
        try:
            # Initialize session with appropriate providers
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if cuda_available else ['CPUExecutionProvider']
            print(f"⚙️  Using providers: {providers}")
            
            session = new_session(
                'u2net',  # Use u2net model (smaller and faster than u2netp)
                providers=providers
            )
            
            # The model will be downloaded automatically on first use
            
            print("🔍 Removing background...")
            result = remove(
                img_bytes,
                session=session,
                alpha_matting=True,  # Better for complex images
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10,
                session_options={
                    'providers': providers,
                    'provider_options': [{}] * len(providers)
                }
            )
            
            if not result:
                raise ValueError("Background removal returned empty result")
            
            # Convert to PIL Image and ensure RGBA mode
            result_image = Image.open(io.BytesIO(result))
            if result_image.mode != 'RGBA':
                print(f"🔄 Converting result from {result_image.mode} to RGBA")
                result_image = result_image.convert('RGBA')
            
            # Ensure the image has transparency
            if 'A' not in result_image.getbands():
                print("⚠️  Resulting image has no alpha channel, adding one")
                result_image.putalpha(255)  # Add opaque alpha channel
            
            print(f"✅ Background removed successfully! Original: {image.size} -> Result: {result_image.size}")
            return result_image
            
        except Exception as model_error:
            print(f"⚠️  Model error: {str(model_error)}")
            print("🔄 Falling back to simpler method...")
            
            # Fallback to basic method
            try:
                session = new_session('u2net')
                result = remove(
                    img_bytes,
                    session=session,
                    alpha_matting=False  # Try without alpha matting
                )
                
                if not result:
                    raise ValueError("Fallback background removal failed")
                
                result_image = Image.open(io.BytesIO(result))
                if result_image.mode != 'RGBA':
                    result_image = result_image.convert('RGBA')
                return result_image
                
            except Exception as fallback_error:
                print(f"❌ Fallback method also failed: {str(fallback_error)}")
                raise ValueError(f"All background removal methods failed: {str(fallback_error)}")
            
    except Exception as e:
        error_msg = f"❌ Error in remove_background: {str(e)}"
        print(error_msg)
        print("📋 Make sure you have enough disk space for the model (~200MB)")
        print("🔧 Try running with a smaller image if you're having memory issues")
        if 'No module named' in str(e):
            print("\n⚠️  Missing dependencies. Please install them with:")
            print("pip install -r requirements.txt")
        
        # Return the original image with an alpha channel as fallback
        print("⚠️  Returning original image with added alpha channel as fallback")
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        return image

def enhance_image(image: Image.Image) -> Image.Image:
    """Enhance image quality using Real-ESRGAN"""
    if esrgan_upsampler is None:
        print("Real-ESRGAN not available, skipping enhancement")
        return image
    
    try:
        # Convert PIL to numpy array
        img_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        elif len(img_array.shape) == 3 and img_array.shape[2] == 4:
            # Handle RGBA images
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
        
        # Enhance using Real-ESRGAN
        output, _ = esrgan_upsampler.enhance(img_array, outscale=2)  # 2x upscale for reasonable file sizes
        
        # Convert back to RGB
        output_rgb = cv2.cvtColor(output, cv2.COLOR_BGR2RGB)
        
        # Convert back to PIL Image
        return Image.fromarray(output_rgb)
    except Exception as e:
        print(f"Enhancement failed: {e}, returning original image")
        return image

def add_white_background(image: Image.Image) -> Image.Image:
    """Add white background to transparent image"""
    try:
        if image.mode == 'RGBA':
            # Create white background
            white_bg = Image.new('RGB', image.size, (255, 255, 255))
            white_bg.paste(image, mask=image.split()[3])  # Use alpha channel as mask
            return white_bg
        return image
    except Exception as e:
        print(f"Background addition failed: {e}")
        return image

@app.post("/process-image")
async def process_image(
    file: UploadFile = File(...),
    remove_bg: bool = True,
    enhance: bool = True,
    white_background: bool = False,
    max_size: int = 1024
):
    """
    Process uploaded image with AI enhancements
    
    Args:
        file: Image file to process
        remove_bg: Whether to remove background
        enhance: Whether to enhance image quality
        white_background: Whether to add white background (if remove_bg=True)
        max_size: Maximum dimension for output image
    """
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read uploaded file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB' and image.mode != 'RGBA':
            image = image.convert('RGB')
        
        # Resize if too large (for performance)
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Process image based on options
        processed_image = image
        
        # Step 1: Remove background if requested
        if remove_bg:
            print("Removing background...")
            processed_image = remove_background(processed_image)
        
        # Step 2: Enhance image quality if requested
        if enhance:
            print("Enhancing image quality...")
            processed_image = enhance_image(processed_image)
        
        # Step 3: Add white background if requested and background was removed
        if remove_bg and white_background:
            processed_image = add_white_background(processed_image)
        
        # Convert result to bytes
        output_buffer = io.BytesIO()
        
        # Save with appropriate format
        if remove_bg and not white_background:
            # Keep transparency
            processed_image.save(output_buffer, format='PNG', optimize=True)
            media_type = "image/png"
        else:
            # Save as JPEG for smaller file size
            if processed_image.mode == 'RGBA':
                processed_image = processed_image.convert('RGB')
            processed_image.save(output_buffer, format='JPEG', quality=90, optimize=True)
            media_type = "image/jpeg"
        
        output_buffer.seek(0)
        
        return Response(
            content=output_buffer.getvalue(),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename=processed_{file.filename}",
                "X-Processing-Info": f"bg_removed={remove_bg}, enhanced={enhance}, white_bg={white_background}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.post("/remove-background")
async def remove_background_only(file: UploadFile = File(...)):
    """Quick endpoint for background removal only"""
    return await process_image(file, remove_bg=True, enhance=False, white_background=False)

@app.post("/enhance-image")
async def enhance_image_only(file: UploadFile = File(...)):
    """Quick endpoint for image enhancement only"""
    return await process_image(file, remove_bg=False, enhance=True, white_background=False)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)