import os
import sys
from PIL import Image
import io

def test_background_removal():
    """Test the background removal functionality"""
    print("🔍 Testing background removal...")
    
    # Create a simple image with a colored background
    from PIL import Image, ImageDraw
    
    # Create a 200x200 image with red background and a blue circle
    img = Image.new('RGB', (200, 200), color='red')
    draw = ImageDraw.Draw(img)
    draw.ellipse((50, 50, 150, 150), fill='blue')
    
    # Save test image
    test_img_path = 'test_image.png'
    img.save(test_img_path)
    print(f"✅ Created test image: {test_img_path}")
    
    # Import the remove_background function
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from main import remove_background
    
    # Test background removal
    print("🚀 Starting background removal...")
    result = remove_background(img)
    
    if result is not None:
        result_path = 'result_removed_bg.png'
        result.save(result_path)
        print(f"✅ Background removal successful! Result saved to: {result_path}")
        print("   The background should now be transparent (check the image file)")
    else:
        print("❌ Background removal failed. Check the error messages above.")

if __name__ == "__main__":
    test_background_removal()
