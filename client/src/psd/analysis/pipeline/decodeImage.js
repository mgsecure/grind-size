export async function decodeImageToImageData(file) {
    const url = URL.createObjectURL(file)
    try {
        const img = new Image()
        img.decoding = 'async'
        img.src = url
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d', {willReadFrequently: true})
        ctx.drawImage(img, 0, 0)
        return ctx.getImageData(0, 0, canvas.width, canvas.height)
    } finally {
        URL.revokeObjectURL(url)
    }
}
