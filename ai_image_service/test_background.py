import os
import sys
import requests
from PIL import Image, ImageDraw

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Test with different image types and complexities
def create_test_images():
    """Create test images with different backgrounds and objects"""
    # Simple colored background with shape
    img1 = Image.new('RGB', (400, 400), color='red')
    draw = ImageDraw.Draw(img1)
    draw.ellipse((100, 100, 300, 300), fill='blue')
    img1.save('test_simple.png')
    
    # Gradient background with text
    img2 = Image.new('RGB', (400, 400), color='white')
    draw = ImageDraw.Draw(img2)
    for i in range(400):
        color = (i//2, i//2, i//2)
        draw.line([(i, 0), (i, 400)], fill=color)
    draw.rectangle((100, 100, 300, 300), fill='green')
    draw.text((150, 200), 'TEST', fill='white')
    img2.save('test_complex.png')
    
    return ['test_simple.png', 'test_complex.png']

def test_background_removal():
    """Test background removal with detailed diagnostics"""
    print("🚀 Starting background removal test...")
    
    # Create test images
    test_images = create_test_images()
    
    # Import the function after setting up paths
    from ai_image_service.main import remove_background
    
    for img_path in test_images:
        print(f"\n🔍 Testing with {img_path}")
        try:
            # Load the image
            img = Image.open(img_path)
            print(f"✅ Loaded {img_path}: {img.size} pixels")
            
            # Test background removal
            print("🚀 Starting background removal...")
            result = remove_background(img)
            
            if result is not None and hasattr(result, 'save'):
                result_path = f'result_{os.path.basename(img_path)}'
                result.save(result_path, 'PNG')
                print(f"✅ Background removal successful! Result saved to: {result_path}")
                print(f"   Original mode: {img.mode}, Result mode: {result.mode}")
                print(f"   Has alpha: {'Yes' if 'A' in result.getbands() else 'No'}")
            else:
                print(f"❌ Background removal failed for {img_path}")
                print(f"   Result type: {type(result)}")
                
        except Exception as e:
            print(f"❌ Error processing {img_path}: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    # Install dependencies if needed
    print("🔧 Checking dependencies...")
    try:
        import rembg
        import torch
        print(f"✅ rembg version: {rembg.__version__}")
        print(f"✅ PyTorch version: {torch.__version__}")
        print(f"✅ CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"✅ GPU: {torch.cuda.get_device_name(0)}")
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("Please install required packages with:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    
    # Run tests
    test_background_removal()
