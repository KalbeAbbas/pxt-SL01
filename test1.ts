basic.forever(function () {
    basic.showNumber(SL01.getLUX(Illuminance.Lux))
    basic.showNumber(SL01.getLUX(Illuminance.FootCandle))
    basic.showNumber(SL01.getUVA())
    basic.showNumber(SL01.getUVB())
    basic.showNumber(SL01.getUVIndex())
    basic.pause(100)
})
