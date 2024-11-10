const uploadInput = document.getElementById("upload-image");
const canvas = document.getElementById("image-canvas");
const ctx = canvas.getContext("2d");
const colorPaletteDiv = document.getElementById("color-palette");

let img = new Image();
let wallRegion = null; // To store the wall region (auto-selection)

// Fixed colors to simulate paint colors
const colorPalette = [
    "#F44336", // Red
    "#FF9800", // Orange
    "#FFEB3B", // Yellow
    "#4CAF50", // Green
    "#2196F3", // Blue
    "#9C27B0", // Purple
    "#E91E63", // Pink
    "#607D8B", // Grey
    "#00BCD4", // Cyan
];

// Step 1: Handle Image Upload
uploadInput.addEventListener("change", handleImageUpload);

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            displayPalette(); // Display color palette after image is loaded
        };
        img.src = URL.createObjectURL(file);
    }
}

// Step 2: Display Fixed Color Palette with Gradients
function displayPalette() {
    colorPaletteDiv.innerHTML = ''; // Clear previous palette
    colorPalette.forEach(color => {
        const colorDiv = document.createElement("div");
        colorDiv.classList.add("color-swatch");
        
        // Create a gradient for the color
        const gradient = chroma.scale([color, 'white']).mode('lab').colors(10).join(', ');
        colorDiv.style.background = `linear-gradient(to right, ${gradient})`;

        // Handle color selection
        colorDiv.addEventListener("click", () => generateColorGrades(color));
        colorPaletteDiv.appendChild(colorDiv);
    });
}

// Step 3: Generate Color Shades/Grades
function generateColorGrades(baseColor) {
    const colorShades = chroma.scale([baseColor, 'white']).mode('lab').colors(10);
    displayColorGrades(colorShades);
}

// Step 4: Display Color Shades Below Palette
function displayColorGrades(shades) {
    const shadesDiv = document.createElement("div");
    shadesDiv.innerHTML = "<h2>Color Shades</h2>"; // Title for shades section

    shades.forEach((shade, index) => {
        const shadeDiv = document.createElement("div");
        shadeDiv.classList.add("color-swatch");
        shadeDiv.style.backgroundColor = shade;
        shadeDiv.title = `Shade ${index + 1}`;

        // Handle shade selection (apply to wall)
        shadeDiv.addEventListener("click", () => applyColorToWall(shade));
        shadesDiv.appendChild(shadeDiv);
    });

    colorPaletteDiv.appendChild(shadesDiv);
}

// Step 5: Apply Color to the Wall
function applyColorToWall(selectedColor) {
    if (wallRegion) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Apply selected color to the wall region
        for (let y = wallRegion.top; y < wallRegion.bottom; y++) {
            for (let x = wallRegion.left; x < wallRegion.right; x++) {
                const i = (y * canvas.width + x) * 4; // Calculate pixel index
                const color = chroma(selectedColor).rgb();
                pixels[i] = color[0]; // Red channel
                pixels[i + 1] = color[1]; // Green channel
                pixels[i + 2] = color[2]; // Blue channel
            }
        }

        // Put the modified image data back onto the canvas
        ctx.putImageData(imageData, 0, 0);
    } else {
        alert("Please select a wall region first.");
    }
}

// Step 6: Auto-Select Wall Region on Click
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const clickedColor = getColorAtPixel(mouseX, mouseY, imageData);
    
    // Use flood-fill to detect the entire wall region
    wallRegion = floodFill(mouseX, mouseY, clickedColor, imageData);

    // Draw a border around the selected region for feedback
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(wallRegion.left, wallRegion.top, wallRegion.right - wallRegion.left, wallRegion.bottom - wallRegion.top);
});

// Get the color at a specific pixel
function getColorAtPixel(x, y, imageData) {
    const index = (y * canvas.width + x) * 4;
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    return { r, g, b };
}

// Flood-fill to select the wall region based on color similarity
function floodFill(x, y, baseColor, imageData) {
    const width = canvas.width;
    const height = canvas.height;
    const threshold = 50; // Threshold for color similarity

    const stack = [[x, y]];
    const region = { left: x, top: y, right: x, bottom: y };

    const pixels = imageData.data;

    // Iterate over the stack
    while (stack.length > 0) {
        const [cx, cy] = stack.pop();

        // Get the color of the current pixel
        const index = (cy * width + cx) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];

        // Check if this pixel is similar to the base color (wall)
        const colorDiff = Math.abs(r - baseColor.r) + Math.abs(g - baseColor.g) + Math.abs(b - baseColor.b);
        if (colorDiff < threshold) {
            // Mark the bounds of the region
            region.left = Math.min(region.left, cx);
            region.top = Math.min(region.top, cy);
            region.right = Math.max(region.right, cx);
            region.bottom = Math.max(region.bottom, cy);

            // Add neighboring pixels to the stack
            if (cx > 0) stack.push([cx - 1, cy]);
            if (cy > 0) stack.push([cx, cy - 1]);
            if (cx < width - 1) stack.push([cx + 1, cy]);
            if (cy < height - 1) stack.push([cx, cy + 1]);
        }
    }

    return region;
}

// Debugging check to ensure chroma is loaded
console.log(chroma); // This should log 'chroma' if the library is loaded properly
