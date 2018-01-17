/**
 * SL01 Light Sensor
 */
//% weight=10 color=#9F79EE icon="\uf108" block="SL01"
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
	const VEML6075_UVA_VIS_COEFF = (333/100)
	const VEML6075_UVA_IR_COEFF = (25/10)
	const VEML6075_UVB_VIS_COEFF = (366/100)
	const VEML6075_UVB_IR_COEFF = (275/100)
	const VEML6075_UVA_RESP = (11/10000)
	const VEML6075_UVB_RESP = (125/100000)

	const TSL4531_REG_CONTROL =	0x00
	const TSL4531_REG_CONF = 0x01	
	const TSL4531_REG_DATA_LOW	= 0x04	
	const TSL4531_REG_DATA_HIGH	= 0x05
	const TSL4531_WRITE_CMD	= 0x80
	const TSL4531_CONF_PWR_DOWN = 0x00
	const TSL4531_CONF_ONE_RUN = 0x02
	const TSL4531_CONF_START = 0x03
	const TSL4531_CONF_IT_100 =	0x02	
	const TSL4531_CONF_IT_200 =	0x01
	const TSL4531_CONF_IT_400 =	0x00
	const TSL4531_CONF_PSAVE = 0x02
	
	function WriteRegTSL(addr: number, cmd: number) {
		let buf: Buffer = pins.createBuffer(2);
		buf[0] = addr;
		buf[1] = cmd;
		pins.i2cWriteBuffer(0x29, buf, false);
	}
	
	function ReadRegTSL(addr: number): number {
		let buf: Buffer = pins.createBuffer(1);
		buf[0] = addr;
		pins.i2cWriteBuffer(0x29, buf, false);
		buf = pins.i2cReadBuffer(0x29, 1, false);
		return buf[0];
	}

  	function WriteRegVEML(addr: number, cmd_L: number, cmd_H: number) {
		let buf: Buffer = pins.createBuffer(3);
		buf[0] = addr;
		buf[1] = cmd_L;
		buf[2] = cmd_H;
		pins.i2cWriteBuffer(0x10, buf, false);
	}

	function ReadRegVEML(addr: number): number {
	    let buf: Buffer = pins.createBuffer(2);
	    buf[0] = addr;
	    pins.i2cWriteBuffer(0x10, buf, false);
	    buf = pins.i2cReadBuffer(0x10, 2, false);
	    let result = ((buf[0] << 8)+ buf[1]);
	    return result;
	}	
	
	/**
 	* SL01 Init 
 	*/
	//% blockId="Init" block="Initialize SL01"
  	//% blockGap=1 weight=90
	export function init(): void {
		WriteRegVEML(VEML6075_REG_CONF, VEML6075_CONF_IT_100, 0x00);
		WriteRegTSL((TSL4531_WRITE_CMD|TSL4531_REG_CONTROL), TSL4531_CONF_START);
		WriteRegTSL((TSL4531_WRITE_CMD|TSL4531_REG_CONF), (TSL4531_CONF_IT_100|TSL4531_CONF_PSAVE));
	}

	/**
  	* SL01 Ambient Light (Lux)
  	*/
  	//% blockId="Lux" block="Visible Light (Lux)"
  	//% blockGap=1 weight=90
  	//% Lux.min=4 Lux.max=220000	
	export function getLux(): number {
		let byteH = ReadRegTSL(0x85);
		let byteL = ReadRegTSL(0x84);
		let lux = (4*((byteH << 8) + byteL));
		return lux;
	}
	
	/**
	* SL01 UVA (mW/cm^2)
	*/
	//% blockId="UVA" block="UVA (mW/cm^2)"
	//% blockGap=1 weight=90
	export function getUVA(): number {
	    let UVAsensitivity = 46/100;
	    let rawUVA = ReadRegVEML(VEML6075_REG_UVA);
	    let uva = (rawUVA/UVAsensitivity);
	    return uva;
	}
}
