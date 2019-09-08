enum SL01_L {
    //% block="lx"
    LX = 0,
    //% block="fc"
    FC = 1
}

/**
 * SL01 Light Sensor
 */
//% color=#444444 icon="\uf0eb" block="SL01"
//% groups=['On start', 'Variables', 'Optional']
namespace SL01 {
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
 	* SL01 Init 
 	*/
    //% blockId="Init" block="initialize SL01"
    //% group="On start"
    //% weight=90 blockGap=8
    export function init(): void {
        writeVEML(VEML6075_REG_CONF, VEML6075_CONF_IT_100, 0x00);
        writeTSL((TSL4531_WRITE_CMD | TSL4531_REG_CONTROL), TSL4531_CONF_START);
        writeTSL((TSL4531_WRITE_CMD | TSL4531_REG_CONF), (TSL4531_CONF_IT_100 | TSL4531_CONF_PSAVE));
        getLUX(SL01_L.LX);
        getUVIdata();
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
        let byteH = readTSL(0x85);
        let byteL = readTSL(0x84);
        let lux = (4 * ((byteH << 8) | byteL));
        if (u == SL01_L.LX) return lux;
        else return lux / 10.764;
    }


	/**
	* Ultraviolet A (mW/cm²)
    * https://en.wikipedia.org/wiki/Ultraviolet
	*/
    //% blockId="UVA" block="SL01 Ultraviolet A (mW/cm²)"
    //% group="Variables"
    //% weight=90 blockGap=8
    export function getUVA(): number {
        return getUVAdata();
    }
    /**
    * Ultraviolet B (mW/cm²)
    * https://en.wikipedia.org/wiki/Ultraviolet
    */
    //% blockId="UVB" block="SL01 Ultraviolet B (mW/cm²)"
    //% group="Variables"
    //% weight=90 blockGap=8
    export function getUVB(): number {
        return getUVBdata();
    }
    /**
    * The ultraviolet index
    * https://en.wikipedia.org/wiki/Ultraviolet_index
    */
    //% blockId="UVIndex" block="SL01 Ultraviolet index"
    //% group="Variables"
    //% weight=90 blockGap=8
    export function getUVIndex(): number {
        return getUVIdata();
    }
}
