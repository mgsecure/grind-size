import { FastAverageColor } from 'fast-average-color'

export default async function getColorTemperature(file) {

    const fac = new FastAverageColor()
    const objectUrl = URL.createObjectURL(file)
    return fac.getColorAsync(objectUrl)
        .then(color => {
            return rgb2colorTemperature({ red: color.value[0], green: color.value[1], blue: color.value[2] })
        })
        .catch(e => {
            console.log(e)
        })
        . finally(() => {
            URL.revokeObjectURL(objectUrl)
        })
}

export function rgb2colorTemperature(rgb) {
    let temperature, testRGB
    let epsilon=0.4
    let minTemperature = 1000
    let maxTemperature = 40000
    while (maxTemperature - minTemperature > epsilon) {
        temperature = (maxTemperature + minTemperature) / 2
        testRGB = colorTemperature2rgb(temperature)
        if ((testRGB.blue / testRGB.red) >= (rgb.blue / rgb.red)) {
            maxTemperature = temperature
        } else {
            minTemperature = temperature
        }
    }
    return Math.round(temperature)
}

export function colorTemperature2rgb(kelvin) {

    let temperature = kelvin / 100.0
    let red, green, blue

    if (temperature < 66.0) {
        red = 255
    } else {
        // a + b x + c Log[x] /.
        // {a -> 351.97690566805693`,
        // b -> 0.114206453784165`,
        // c -> -40.25366309332127
        //x -> (kelvin/100) - 55}
        red = temperature - 55.0
        red = 351.97690566805693+ 0.114206453784165 * red - 40.25366309332127 * Math.log(red)
        if (red < 0) red = 0
        if (red > 255) red = 255
    }

    /* Calculate green */

    if (temperature < 66.0) {

        // a + b x + c Log[x] /.
        // {a -> -155.25485562709179`,
        // b -> -0.44596950469579133`,
        // c -> 104.49216199393888`,
        // x -> (kelvin/100) - 2}
        green = temperature - 2
        green = -155.25485562709179 - 0.44596950469579133 * green + 104.49216199393888 * Math.log(green)
        if (green < 0) green = 0
        if (green > 255) green = 255

    } else {

        // a + b x + c Log[x] /.
        // {a -> 325.4494125711974`,
        // b -> 0.07943456536662342`,
        // c -> -28.0852963507957`,
        // x -> (kelvin/100) - 50}
        green = temperature - 50.0
        green = 325.4494125711974 + 0.07943456536662342 * green - 28.0852963507957 * Math.log(green)
        if (green < 0) green = 0
        if (green > 255) green = 255

    }

    /* Calculate blue */

    if (temperature >= 66.0) {
        blue = 255
    } else {

        if (temperature <= 20.0) {
            blue = 0
        } else {

            // a + b x + c Log[x] /.
            // {a -> -254.76935184120902`,
            // b -> 0.8274096064007395`,
            // c -> 115.67994401066147`,
            // x -> kelvin/100 - 10}
            blue = temperature - 10
            blue = -254.76935184120902 + 0.8274096064007395 * blue + 115.67994401066147 * Math.log(blue)
            if (blue < 0) blue = 0
            if (blue > 255) blue = 255
        }
    }

    return {red: Math.round(red), blue: Math.round(blue), green: Math.round(green)}
}
