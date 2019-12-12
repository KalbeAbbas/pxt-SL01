/**
 * SL01 Light Sensor
 */
//% color=#444444 icon="\uf0eb" block="SL01"
//% groups=['On start', 'Variables', 'Optional']
namespace SL01 {
    export enum SL01_L {
        //% block="lx"
        LX = 1,
        //% block="fc"
        FC = 2
    }

    export enum DISTANCE {
        //% block="m"
        METER = 1,
        //% block="cm"
        CENTIMETER = 2
    }

    let SI1145_I2C_ADDR = 0x60
    let TSL_I2C_ADDR = 0x29
    let VEML_I2C_ADDR = 0x10

    let initialized = false
    const VEML6075_REG_CONF = 0x00
    const VEML6075_REG_UVA = 0x07
    const VEML6075_REG_UVB = 0x09
    const VEML6075_REG_UVCOMP1 = 0x0A
    const VEML6075_REG_UVCOMP2 = 0x0B
    const VEML6075_CONF_HD_NORM = 0x00
    const VEML6075_CONF_HD_HIGH = 0x80
    const VEML6075_CONF_UV_TRIG_ONCE = 0x04
    const VEML6075_CONF_UV_TRIG_NORM = 0x00
    const VEML6075_CONF_AF_FORCE = 0x00
    const VEML6075_CONF_AF_AUTO = 0x02
    const VEML6075_CONF_SD_OFF = 0x00
    const VEML6075_CONF_SD_ON = 0x01
    const VEML6075_CONF_IT_50 = 0x00
    const VEML6075_CONF_IT_100 = 0x10
    const VEML6075_CONF_IT_200 = 0x20
    const VEML6075_CONF_IT_400 = 0x30
    const VEML6075_CONF_IT_800 = 0x40
    const VEML6075_UVA_VIS_COEFF = (333 / 100)
    const VEML6075_UVA_IR_COEFF = (25 / 10)
    const VEML6075_UVB_VIS_COEFF = (366 / 100)
    const VEML6075_UVB_IR_COEFF = (275 / 100)
    const VEML6075_UVA_RESP = (11 / 10000)
    const VEML6075_UVB_RESP = (125 / 100000)

    const TSL4531_REG_CONTROL = 0x00
    const TSL4531_REG_CONF = 0x01
    const TSL4531_REG_DATA_LOW = 0x04
    const TSL4531_REG_DATA_HIGH = 0x05
    const TSL4531_WRITE_CMD = 0x80
    const TSL4531_CONF_PWR_DOWN = 0x00
    const TSL4531_CONF_ONE_RUN = 0x02
    const TSL4531_CONF_START = 0x03
    const TSL4531_CONF_IT_100 = 0x02
    const TSL4531_CONF_IT_200 = 0x01
    const TSL4531_CONF_IT_400 = 0x00
    const TSL4531_CONF_PSAVE = 0x02

    function writeTSL(addr: number, cmd: number) {
        let buf: Buffer = pins.createBuffer(2);
        buf[0] = addr;
        buf[1] = cmd;
        pins.i2cWriteBuffer(0x29, buf, false);
    }

    function readTSL(addr: number): number {
        let buf: Buffer = pins.createBuffer(1);
        buf[0] = addr;
        pins.i2cWriteBuffer(0x29, buf, false);
        buf = pins.i2cReadBuffer(0x29, 1, false);
        return buf[0];
    }

    function writeVEML(addr: number, cmd_L: number, cmd_H: number) {
        let buf: Buffer = pins.createBuffer(3);
        buf[0] = addr;
        buf[1] = cmd_L;
        buf[2] = cmd_H;
        pins.i2cWriteBuffer(0x10, buf, false);
    }

    function readVEML(addr: number): number {
        pins.i2cWriteNumber(0x10, addr, NumberFormat.UInt8LE, true)
        let rawData = pins.i2cReadNumber(0x10, NumberFormat.UInt16LE, false);
        return rawData;
    }

    /* reads raw uva data and calculates uva */
    function getUVAdata(): number {
        let rawUVA = readVEML(VEML6075_REG_UVA);
        let UVcomp1 = readVEML(VEML6075_REG_UVCOMP1);
        let UVcomp2 = readVEML(VEML6075_REG_UVCOMP2);
        let uva = rawUVA - ((VEML6075_UVA_VIS_COEFF * UVcomp1) - (VEML6075_UVA_IR_COEFF * UVcomp2));
        return uva;
    }

    /* reads raw uvb data and calculates uvb */
    function getUVBdata(): number {
        let rawUVB = readVEML(VEML6075_REG_UVB);
        let UVcomp1 = readVEML(VEML6075_REG_UVCOMP1);
        let UVcomp2 = readVEML(VEML6075_REG_UVCOMP2);
        let uvb = rawUVB - ((VEML6075_UVB_VIS_COEFF * UVcomp1) - (VEML6075_UVB_IR_COEFF * UVcomp2));
        return uvb;
    }

    /* calculates uvi */
    function getUVIdata(): number {
        let UVAComp = 0;
        let UVBComp = 0;
        UVAComp = (getUVAdata() * VEML6075_UVA_RESP);
        UVBComp = (getUVBdata() * VEML6075_UVB_RESP);
        let uvi = (UVAComp + UVBComp) / 2;
        return uvi;
    }

	/**
 	* start SL01 
 	*/
    // % blockId="Init" block="start SL01"
    // % group="On start"
    // % weight=90 blockGap=8
    function init(): void {
        if (initialized) return
        initialized = true
        writeVEML(VEML6075_REG_CONF, VEML6075_CONF_IT_100, 0x00);
        writeTSL((TSL4531_WRITE_CMD | TSL4531_REG_CONTROL), TSL4531_CONF_START);
        writeTSL((TSL4531_WRITE_CMD | TSL4531_REG_CONF), (TSL4531_CONF_IT_100 | TSL4531_CONF_PSAVE));
        getLUX(SL01_L.LX);
        getUVIdata();
    }

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(SI1145_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.Int16LE);
    }

    function writeParam(p: number, v: number) {
        setreg(0x17, v)
        setreg(0x18, p | 0xA0)

        return getreg(0x2E);
    }

    function reset(): void {
        setreg(0x08, 0x00)
        setreg(0x09, 0x00)
        setreg(0x04, 0x00)
        setreg(0x05, 0x00)
        setreg(0x06, 0x00)
        setreg(0x03, 0x00)
        setreg(0x21, 0xFF)

        setreg(0x18, 0x01)
        basic.pause(10)
        setreg(0x07, 0x17)
        basic.pause(10)
    }

    function begin(): void {
        let id: number = getreg(0x00)

        if (id != 0x45) console.log("SL01 not connected")

        reset()

        // enable UVindex measurement coefficients!
        setreg(0x13, 0x29);
        setreg(0x14, 0x89);
        setreg(0x15, 0x02);
        setreg(0x16, 0x00);

        // enable UV sensor
        writeParam(0x01, 0x80 | 0x20 | 0x10 | 0x01);
        // enable interrupt on every sample
        setreg(0x03, 0x01);
        setreg(0x04, 0x01);


        /****************************** Prox Sense 1 */
        // program LED current
        setreg(0x0F, 0x03); // 20mA for LED 1 only
        writeParam(0x07, 0x03);
        // prox sensor #1 uses LED #1
        writeParam(0x02, 0x01);
        // fastest clocks, clock div 1
        writeParam(0x0B, 0);
        // take 511 clocks to measure
        writeParam(0x0A, 0x70);
        // in prox mode, high range
        writeParam(0x0C, 0x20 | 0x04);

        writeParam(0x0E, 0x00);
        // fastest clocks, clock div 1
        writeParam(0x1E, 0);
        // take 511 clocks to measure
        writeParam(0x1D, 0x70);
        // in high range mode
        writeParam(0x1F, 0x20);

        // fastest clocks, clock div 1
        writeParam(0x11, 0);
        // take 511 clocks to measure
        writeParam(0x10, 0x70);
        // in high range mode (not normal signal)
        writeParam(0x12, 0x20);


        /************************/

        // measurement rate for auto
        setreg(0x08, 0xFF); // 255 * 31.25uS = 8ms

        // auto run
        setreg(0x18, 0x0F);
    }

    function fix(x: number) {
        return Math.round(x * 100) / 100
    }

    let v1 = 0
    let v2 = 0
    function checkID(): void {
        if (getreg(0x00) == 0x45) v2 = 1;
        else if (readVEML(0x0C) == (0x26 & 0x0026)) v1 = 1;
    }

    checkID();
    if (v2) begin();

	/**
	* Ultraviolet A (mW/cm²)
    * https://en.wikipedia.org/wiki/Ultraviolet
	*/
    //% blockId="UVA" block="SL01 Ultraviolet A (mW/cm²)"
    //% group="Variables"
    //% weight=90 blockGap=8
    export function getUVA(): number {
        if (v1) {
            init()
            return fix(getUVAdata());
        } else return 0;
    }

    /**
    * Ultraviolet B (mW/cm²)
    * https://en.wikipedia.org/wiki/Ultraviolet
    */
    //% blockId="UVB" block="SL01 Ultraviolet B (mW/cm²)"
    //% group="Variables"
    //% weight=90 blockGap=8
    export function getUVB(): number {
        if (v1) {
            init()
            return fix(getUVBdata())
        } else return 0;
    }

    /**
    * The ultraviolet index
    * https://en.wikipedia.org/wiki/Ultraviolet_index
    */
    //% blockId="UVIndex" block="SL01 Ultraviolet index"
    //% group="Variables"
    //% weight=90 blockGap=8
    export function getUVI(): number {
        let val = 0;
        if (v1) {
            init();
            val = fix(getUVIdata());
        }

        if (v2) {
            val = (getUInt16LE(0x2C) / 100);
        }
        return val;
    }

	/**
  	* Illuminance in lux or foot-candle
    * https://en.wikipedia.org/wiki/Illuminance
    * @param u the illuminance unit
  	*/
    //% blockId="Lux" block="SL01 illuminance %u"
    //% group="Variables"
    //% weight=90 blockGap=8
    //% Lux.min=4 Lux.max=220000
    export function getLUX(u: SL01_L): number {
        let val = 0;
        if (v1) {
            init()
            let byteH = readTSL(0x85);
            let byteL = readTSL(0x84);
            let lux = (4 * ((byteH << 8) | byteL));
            if (u == SL01_L.LX) val = lux;
            else val = (lux / 10.764);
        }

        if (v2) {
            if (u == SL01_L.LX) {
                val = getUInt16LE(0x22)
            } else if (u == SL01_L.FC) {
                val = (getUInt16LE(0x22) / 10.764)
            }
        }
        return val;
    }

    /**
     *  Proximity
    */
    //% block="SL01 proximity %u"
    //% weight=74 blockGap=8
    //% group="Variables"
    export function readProximity(u: DISTANCE): number {
        let val = 0
        if (v2) {
            ;
            if (u == DISTANCE.CENTIMETER) {
                val = getUInt16LE(0x26)
            } else if (u == DISTANCE.METER) {
                val = (getUInt16LE(0x26) / 100)
            }
        }
        return val
    }

    /**
     *  Infra Red Intensity
    */
    //% block="SL01 infrared intensity"
    //% weight=74 blockGap=8
    //% group="Variables"
    export function readIR(): number {
        let val = 0
        if (v2) {
            val = getUInt16LE(0x24)
        }
        return val;
    }
}