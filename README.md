# pxt-SL01

This is the MakeCode Package for ☒CHIP SL01

## Blocks
### Initialize SL01
Initializes the SL01 Light Sensor.

Sets up the SL01 and prepares it for use by the micro:bit.

```sig
SL01.init();
```

This block must be placed before any other SL01 related blocks.

### SL01 Ambient Light (Lux)
Instructs the Sensor to perform a LUX measurement.

```sig
SL01.getUVB()
```

### SL01 UVA (mW/cm^2)
Instructs the Sensor to perform a UVA measurement.

```sig
SL01.getUVA()
```

## Supported targets

* for PXT/microbit

```package
SL01=github:xinabox/pxt-SL01
```