package cn.timewalking.automation.devices.imp;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.math.BigDecimal;
import java.util.Date;

import javax.imageio.ImageIO;

import org.springframework.context.annotation.Description;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import antelope.utils.ClasspathResourceUtil;
import cn.timewalking.automation.devices.io.DeviceCtrlBase;

/**
 * @author Administrator
 *
 */
@Component("signalAnalyzer")
@Scope(value = "prototype")
public class SignalAnalyzer extends VisaDeviceBase {

	private final String DEFAULT_REMOTE_SAVE_IMAGE_NAME = "'C:\\R_S\\Instr\\user\\ScreenShoot.png'"; // 20170518
	private boolean str;
	private final String N9030_REMOTE_SAVE_IMAGE_NAME = "D:\\SCREEN.PNG";
	private final String DEFAULT_LOCAL_SAVE_IMAGE_FILENAME = "SCREEN.GIF";

	private int selectmarker = 1;
	private boolean isscreen = false;
	private byte[] imgBuf = new byte[50000000];
	ByteArrayInputStream memoryStream = new ByteArrayInputStream(imgBuf);
	private String Fullscreensrc = "D:\\SCREEN.PNG";
	public String imgStr;

	public SignalAnalyzer() {
		super();
	}

	@Override
	public void start() {
		this.m_ioCtrl = new DeviceIOController(getPropertyValue("signalAnalyzerName"),
				getPropertyValue("signalAnalyzerIP"));
		this.m_ioCtrl.open();

		notifyPropertyChanged("runtimestatus", DeviceCtrlBase.STATUS_DEFINITION[1]);
		if (!isRunning()) {
			new Thread(new Runnable() {
				@Override
				public void run() {
					isRunning(true);
					while (isRunning()) {
						try {
							if (str) {
								notifyPropertyChanged("runtimestatus", DeviceCtrlBase.STATUS_DEFINITION[1]);
							} else {
								double s = GetSpan_1();
								if (s == 0.0) {
									str = false;
									star();
									notifyPropertyChanged("runtimestatus", DeviceCtrlBase.STATUS_DEFINITION[2]);
								} else {
									notifyPropertyChanged("runtimestatus", DeviceCtrlBase.STATUS_DEFINITION[0]);
									notifyPropertyChanged("SetCenterFrequency", GetCenterFrequency());
									notifyPropertyChanged("SetSpan", GetSpan());
									notifyPropertyChanged("SetRef", String.valueOf(GetRef()));
									notifyPropertyChanged("SetScaleDiv", String.valueOf(GetScaleDiv()));
									notifyPropertyChanged("SetSweepTime", String.valueOf(GetSweepTime()));
									notifyPropertyChanged("SetSweepPoints", String.valueOf(GetSweepPoints()));
									notifyPropertyChanged("SetResBW", GetResBW());
									notifyPropertyChanged("SetVideoBW", GetVideoBW());
									notifyPropertyChanged("SetSATraceTime", String.valueOf(GetSATraceTime()));
									notifyPropertyChanged("SetSN", String.valueOf(getSN()));
//									notifyPropertyChanged("SetMarkerFuncModeStr", String.valueOf(GetMarkerFuncMode(1)));
									deleteFile();
									if (selectmarker != 0) {
										notifyPropertyChanged("SetBandSpan", GetBandSpan(selectmarker));
										notifyPropertyChanged("SetMarkX", GetMarkX(selectmarker));
										notifyPropertyChanged("SetDeltaMarkX", GetDeltMarkX(selectmarker));
									}
									if (isscreen == true) {
										printScreenMem(memoryStream);
										notifyPropertyChanged("Fullscreensrc", imgStr);
									}
								}

							}
						} catch (Exception e) {
							e.printStackTrace();
						}
						try {
							Thread.sleep(1000);
						} catch (Exception e) {
							e.printStackTrace();
						}

					}
					confirmStop();

				}
			}).start();

		}

	};

	public void deleteFile() {

		File file = ClasspathResourceUtil.getWebappFolderFile("/img");

		File[] listFiles = file.listFiles();
		if (listFiles == null)
			return;
		for (File f : listFiles) {
			f.delete();
		}

	}

	public void stopStr() {
		SignalAnalyzer.this.stop();
	}

	public void star() {
		this.m_ioCtrl.open();

	}

	@Description("关闭")
	public void pinStop(String v) {
		if (v.equals("1")) {
			str = true;
			stopStr();
			notifyPropertyChanged("runtimestatus", DeviceCtrlBase.STATUS_DEFINITION[1]);
		} else {
			str = false;
		}
	}

	@Description("打开")
	public void open() {
		this.m_ioCtrl.open();
		str = false;
	}

	@Description("重置")
	public void Preset() throws Exception {
		this.m_ioCtrl.sendString("SYST:PRES\n");
		// this.GetCenterFrequency();
		// this.GetSpan();
		// this.GetRefVal();
		// this.GetResBW();
		// this.GetVideoBW();
		// this.GetScaleDiv();
	}

	@Description("获取中心频率")
	public String GetCenterFrequency() throws Exception {
		String str = "FREQ:CENT?\n";
		String trim = this.m_ioCtrl.queryString(str).trim();
		return conversion(trim);
	}

	@Description("保存频谱")
	public String SaveScreen() throws Exception {
		printScreenMem(memoryStream);
//    return "automation/image/ScreenShoot.png";
		return "common/customportal/ScreenShoot.png";
	}

	@Description("获取spanCent")
	public double GetSpanCent(int _marker) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + ":X:CENT?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.SpanPairCenter = tmp;
		return tmp;
	}

	@Description("Cal开关")
	public void SetCal(String OnOff) {
		this.m_ioCtrl.sendString("CAL:AUTO " + OnOff + "\n");
	}

	@Description("设置BandSapnAnto")
	public void SetBandSpanAuto(int _val, Boolean _isAuto) {
		String cmdstr = "";
		if (_isAuto) {
			cmdstr = ":CALC:MARK" + _val + ":FUNC:BAND:SPAN:AUTO ON\n";
		} else {
			cmdstr = ":CALC:MARK" + _val + ":FUNC:BAND:SPAN:AUTO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
	}

	@Description("获取SN")
	public String getSN() {
		String cmd = "*IDN?\n";
		String df = m_ioCtrl.queryString(cmd);
		if (df != "" && df != null) {
			df = df.split(",")[2];
		} else {
			df = "设备未连接";
		}
		return df;
	}

	// SpectrumAnalyzer Mode 1 SA N9061-90001.pdf---58页
	@Description("改变SpectrumAnalyzer模式")
	public void SetSAMode() {
		this.m_ioCtrl.sendString(":INSTrument:NSELect 1\n");
	}

	// Phase Noise Mode 14 PNOISE N9061-90001.pdf---58页
	@Description("phase noise mode")
	public void SetPNMode() {
		this.m_ioCtrl.sendString(":INSTrument:NSELect 14\n");
		this.m_ioCtrl.queryString("MEAS:LPL1?\n");// ZJM 加
		this.m_ioCtrl.sendString("DISP:LPL:VIEW DEC\n");// ZJM 加
	}

	@Description("获取AMode")
	public String GetAMode() {
		String str = ":INSTrument:NSELect?\n";
		String tmpstr = this.m_ioCtrl.queryString(str);
		return tmpstr;
	}

	@Override
	@Description("测试连接")
	public boolean TestConnection() {
		try {
			this.m_ioCtrl.open();
			GetCenterFrequency();
			return true;
		} catch (Exception e) {
			return false;
		} finally {
			this.m_ioCtrl.close();
		}
	}

	@Description("设置中心频率")
	public void SetCenterFrequency(double _freq) {
		String cmdstr = "FREQ:CENT " + _freq + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.CenterFrequency = _freq;
	}

	@Description("设置启动频率")
	public void SetStartFrequency(double _freq) {
		String cmdstr = "FREQ:START " + _freq + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.StartFreqency = _freq;
	}

	@Description("获取StartFrequencySA")
	public double GetStartFrequencySA() throws Exception {
		String str = "FREQ:START?\n";
		String tmpstr = this.m_ioCtrl.queryString(str);
		double tmp = new Double(tmpstr);

		return tmp;
	}

	@Description("获取开启频率")
	public double GetStartFrequency() throws Exception {
		String str = ":LPLot:FREQuency:OFFSet:STARt?\n";
		String tmpstr = this.m_ioCtrl.queryString(str);
		double tmp = new Double(tmpstr);

		return tmp;
	}

	@Description("设置停止频率")
	public void SetStopFrequency(double _freq) {
		String cmdstr = "FREQ:STOP " + _freq + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.StopFreqency = _freq;
	}

	@Description("获取stopFrequence_SA")
	public double GetStopFrequency_SA() throws Exception {
		String str = "FREQ:STOP?\n";
		String tmpstr = this.m_ioCtrl.queryString(str);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("获取停止频率")
	public double GetStopFrequency() throws Exception {
		String str = ":LPLot:FREQuency:OFFSet:STOP?\n";
		String tmpstr = this.m_ioCtrl.queryString(str);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("CF Step Auto")
	public void SetCFStepAuto(Boolean _isAuto) {
		String cmdstr = "";
		if (_isAuto) {
			cmdstr = "FREQ:CENT:STEP:AUTO ON\n";
		} else {
			cmdstr = "FREQ:CENT:STEP:AUTO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.CFStepAuto = _isAuto;
	}

	@Description("获取 CF Step Auto")
	public boolean GetCFStepAuto() throws Exception {
		boolean result = false;
		String str = "FREQ:CENT:STEP:AUTO?\n";
		String tmpstr = this.m_ioCtrl.queryString(str);
		BigDecimal tmpBD = new BigDecimal(tmpstr);
		int int_result = tmpBD.compareTo(BigDecimal.ZERO);
		if (int_result > 0) {
			result = true;
		}
		return result;

	}

	@Description("设置CF Step，默认单位HZ")
	public void SetCFStep(double _freq) {
		String cmdstr = "FREQ:CENT:STEP " + _freq + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.CFStep = _freq;
	}

	@Description("获取CF step")
	public double GetCFStep() throws Exception {
		String cmdstr = "FREQ:CENT:STEP?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("设置FreqOffset 默认单位HZ")
	public void SetFreqOffset(double _freq) {
		String cmdstr = "FREQ:OFFS " + _freq + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.FreqOffset = _freq;
	}

	// FreqOffset,带单位
	// <param name="_freq">未经过单位统一换算的频率值</param>
	// <param name="_unit">单位</param>
	// public void SetFreqOffset(double _freq, FrequencyUnit _unit) {
	// String cmdstr = "FREQ:OFFS " + _freq.ToString() + " " + _unit.ToString()
	// + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.FreqOffset = _freq;
	// }

	@Description("获取FreqOffset")
	public double GetFreqOffset() throws Exception {
		String cmdstr = ":FREQuency:OFFSet?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("FreqCarr")
	public void SetFreqCarr(double _freq) // 2017.5.22 SQ add
	{
		String cmdstr = "FREQ:CARR " + _freq + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.FreqCarr = _freq;
	}

	@Description("FreqStrOffset")
	public void SetFreqStrOffset(double _freq) // 2017.5.22 SQ add
	{
		String cmdstr = ":LPLot:FREQuency:OFFSet:STARt " + _freq + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.FreqStartOffset = _freq;
	}

	@Description("FreqStopOffset")
	public void SetFreqStopOffset(double _freq) // 2017.5.22 SQ add
	{
		String cmdstr = ":LPLot:FREQuency:OFFSet:STOP " + _freq + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.FreqStopOffset = _freq;
	}

	@Description("设置Span 默认单位HZ")
	public void SetSpan(double _val) {
		String cmdstr = "FREQ:SPAN " + _val + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Span = _val;
	}

	// 带宽为最大 此方法必须调用GetSpan方法，才能给data赋值
	@Description("设置最大带宽")
	public void SetFullSpan() throws Exception {
		String cmdstr = "FREQ:SPAN:FULL\n";
		// GetSpan();
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Span = 44 * 1E9;
	}

	@Description("设置0带宽")
	public void SetZeroSpan() throws Exception {
		String cmdstr = "FREQ:SPAN 0 hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Span = 44 * 1E9;
	}

	// 带宽为上次的带宽 此方法必须调用GetSpan方法，才能给data赋值
	@Description("将带宽设置为上次带宽")
	public void SetLastSpan() throws Exception {
		String cmdstr = "FREQ:SPAN:PREV\n";
		GetSpan();
		this.m_ioCtrl.sendString(cmdstr);
	}

	@Description("获取span")
	public String GetSpan() throws Exception {
		String cmdstr = "FREQ:SPAN?\n";
		String trim = this.m_ioCtrl.queryString(cmdstr).trim();

		if (trim != null && trim != "") {
			return conversion(trim);

		} else {
			return "0";
		}

	}

	public double GetSpan_1() throws Exception {
		String cmdstr = "FREQ:SPAN?\n";
		double tmp = this.queryDouble(cmdstr);
		return tmp;

	}

	// 10000000
	// 换算
	public String conversion(String str) {
		int length = str.length();
		Double d = Double.valueOf(str);
		String s = "";
		if (length > 0 && length <= 3) {
			// HZ
			d = d / 1;
			s = String.valueOf(d + "+Hz");
		} else if (length >= 4 && length <= 6) {
			// KHZ
			d = d / 1000;
			s = String.valueOf(d + "+KHz");
		} else if (length >= 7 && length <= 9) {
			// MHZ
			d = d / 1000000;
			s = String.valueOf(d + "+MHz");
		} else if (length >= 10) {
			// GHZ
			d = d / 1000000000;
			s = String.valueOf(d + "+GHz");
		}
		return s;
	}

	// ResBW，默认单位hz
	@Description("设置ResBW")
	public void SetResBW(double _val) {
		String cmdstr = "BAND " + _val + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.ResBW = _val;
	}

	@Description("获取ResBW")
	public String GetResBW() throws Exception {
//		String cmdstr = "BAND?\n";
		String tmpstr = this.m_ioCtrl.queryString("BAND?\n").trim();
		return conversion(tmpstr);
	}

	@Description("设置ResBWAuto")
	public void SetResBWAuto(Boolean _isAuto) {

		String cmdstr = "";
		if (_isAuto) {
			cmdstr = "BAND:AUTO ON\n";
		} else {
			cmdstr = "BAND:AUTO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.ResBWAuto = _isAuto;
	}

	@Description("获取ResBWAuto")
	public boolean GetResBWAuto() throws Exception {
		boolean result = false;
		String cmdstr = "BAND:AUTO?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);

		BigDecimal tmpBD = new BigDecimal(tmpstr);
		int int_result = tmpBD.compareTo(BigDecimal.ZERO);
		if (int_result > 0) {
			result = true;
		}
		// AnalyzerData.ResBWAuto=result;
		return result;

	}

	// VideoBW,默认单位Hz
	@Description("Video BW")
	public void SetVideoBW(double _val) {
		String cmdstr = "BAND:VID " + _val + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.VideoBW = _val;
	}

	@Description("获取VideoBW")
	public String GetVideoBW() throws Exception {
//		String cmdstr = "BAND:VID?\n";
		String trim = this.m_ioCtrl.queryString("BAND:VID?\n").trim();
		return conversion(trim);

	}

	@Description("VBWAuto开关")
	public void SetVBWAuto(Boolean _isAuto) {

		String cmdstr = "";
		if (_isAuto) {
			cmdstr = "BAND:VID:AUTO ON\n";
		} else {
			cmdstr = "BAND:VID:AUTO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.VideoBWAuto = _isAuto;
	}

	@Description("获取VBWAuto开关状态")
	public boolean GetVBWAuto() throws Exception {
		boolean result = false;
		String cmdstr = "BAND:VID:AUTO?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		BigDecimal tmpBD = new BigDecimal(tmpstr);
		int int_result = tmpBD.compareTo(BigDecimal.ZERO);
		if (int_result > 0) {
			result = true;
		}
		// AnalyzerData.VideoBWAuto = result;
		return result;
	}

	@Description("RatAuto开关")
	public void SetRatAuto(Boolean _isAuto) {
		String cmdstr = "";
		if (_isAuto) {
			cmdstr = "BAND:VID:RAT:AUTO ON\n";
		} else {
			cmdstr = "BAND:VID:RAT:AUTO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.RatAuto = _isAuto;
	}

	@Description("获取RatAuto开关状态")
	public boolean GetRatAuto() throws Exception {
		boolean result = false;
		String cmdstr = "BAND:VID:RAT:AUTO?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		BigDecimal tmpBD = new BigDecimal(tmpstr);
		int int_result = tmpBD.compareTo(BigDecimal.ZERO);
		if (int_result > 0) {
			result = true;
		}
		// AnalyzerData.RatAuto = result;
		return result;
	}

	// VBW/RBW
	@Description("设置Rat")
	public void SetRat(double _val) throws Exception {
		if (!RatValidate(_val)) {
			throw new Exception("参数超出有效范围！");
		}

		String cmdstr = "BAND:VID:RAT " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Rat = _val;
	}

	// 校验Rat值有效性
	private boolean RatValidate(double _val) {
		if (_val != 0.00001 && _val != 0.00003 && _val != 0.0001 && _val != 0.0003 && _val != 0.001 && _val != 0.003
				&& _val != 0.01 && _val != 0.03 && _val != 0.1 && _val != 0.3 && _val != 1 && _val != 3 && _val != 10
				&& _val != 30 && _val != 100 && _val != 300 && _val != 1000 && _val != 3000 && _val != 10000
				&& _val != 30000 && _val != 100000 && _val != 300000 && _val != 1000000 && _val != 3000000) {
			return false;
		}
		return true;
	}

	@Description("获取Rat")
	public double GetRat() throws Exception {
		String cmdstr = "BAND:VID:RAT?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("Average Auto开关")
	public void SetAverAuto(Boolean _isAuto) {

		String cmdstr = "";
		if (_isAuto) {
			cmdstr = "AVER ON\n";
		} else {
			cmdstr = "AVER OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.AverageAuto = _isAuto;
	}

	@Description("获取 Average Auto状态")
	public boolean GetAverAuto() throws Exception {
		boolean result = false;
		String cmdstr = "AVER?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		BigDecimal tmpBD = new BigDecimal(tmpstr);
		int int_result = tmpBD.compareTo(BigDecimal.ZERO);
		if (int_result > 0) {
			result = true;
		}
		// AnalyzerData.AverageAuto = result;
		return result;
	}

	@Description("设置Average值")
	public void SetAverage(int _val) {
		String cmdstr = "AVER:COUN " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Average = _val;
	}

	@Description("获取Average")
	public int GetAverage() throws Exception {
		String cmdstr = "AVER:COUN?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		Integer tmp = new Integer(tmpstr);
		return tmp;
	}

	@Description("获取Ref")
	public int GetRef() throws Exception {
		String cmdstr = "DISP:WIND:TRACE:Y:RLEV?\n";
		return this.queryInt(cmdstr);
	}

	@Description("Ref")
	public void SetRef(double _val) {
		String cmdstr = "DISP:WIND:TRACE:Y:RLEV " + _val + "dBm\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.RefLvl = _val;
	}

	@Description("获取RefVal")
	public int GetRefVal() throws Exception {
		String cmdstr = "DISP:WIND:TRACE:Y:RLEV?\n";
		return this.queryInt(cmdstr);
	}

	@Description("设置RefVal")
	public void SetRefVal(double _val) {
		String cmdstr = "DISP:WIND:TRACE:Y:RLEV " + _val + "dBm\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.RefVal = _val;
	}

	@Description("设置Atten")
	public void SetAtten(int _val) {
		String cmdstr = "POW:ATT " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Atten = _val;
	}

	@Description("获取Atten")
	public int GetAtten() throws Exception {
		String cmdstr = "POW:ATT?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		Integer tmp = new Integer(tmpstr);
		return tmp;

	}

	@Description("Atten Auto开关")
	public void SetAttenAuto(Boolean _isAuto) {
		String cmdstr = "";
		if (_isAuto) {
			cmdstr = "POW:ATT:AUTO ON\n";
		} else {
			cmdstr = "POW:ATT:AUTO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.AttenAuto = _isAuto;
	}

	@Description("获取Atten Auto开关状态")
	public boolean GetAttenAuto() throws Exception {
		boolean result = false;
		String cmdstr = "POW:ATT:AUTO?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		BigDecimal tmpBD = new BigDecimal(tmpstr);
		int int_result = tmpBD.compareTo(BigDecimal.ZERO);
		if (int_result > 0) {
			result = true;
		}
		// AnalyzerData.AttenAuto=result;
		return result;
	}

	// Scale/Div 单位DB
	@Description("设置Scale div")
	public void SetScaleDiv(double _val) {
		String cmdstr = "DISP:WIND:TRAC:Y " + _val * 10 + " DB\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.ScaleDiv = _val;
	}

	@Description("获取Scale Div")
	public int GetScaleDiv() throws Exception {
		String cmdstr = "DISP:TRACE:Y?\n";
		return this.queryInt(cmdstr) / 10;

	}

	// / <summary>
	// / ScaleType
	// / 输入值为 LOG or LIN
	// / </summary>
	// / <param name="_val"></param>
	// public void SetScaleType(ScaleType _val) {
	// String cmdstr = "DISP:WIND:TRACE:Y:SPAC " + _val + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.ScaleType = Convert.ToString(_val);
	// }

	@Description("获取Scale类型")
	public String GetScaleType() throws Exception {
		String cmdstr = "DISP:WIND:TRACE:Y:SPAC?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);

		if (tmpstr != null && tmpstr != "") {
			// AnalyzerData.ScaleType = tmpstr;
			return tmpstr;
		} else {
			throw new Exception("获取ScaleType失败");
		}

	}

	// 选择Marker 无单位
	@Description("marker开关")
	public void SetMarkerOn(int _val, Boolean _isOn) {

		String cmdstr = "";
		if (_isOn) {
			cmdstr = "CALC:MARK" + _val + ":STAT ON\n";
		} else {
			cmdstr = "CALC:MARK" + _val + ":STAT OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
	}

	@Description("获取marker是否开启")
	public boolean GetMarkerState(int _val) throws Exception {
		boolean result = false;
		String cmdstr = "CALC:MARK" + _val + ":STAT?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		BigDecimal tmpBD = new BigDecimal(tmpstr);
		int int_result = tmpBD.compareTo(BigDecimal.ZERO);
		if (int_result > 0) {
			result = true;
		}
		return result;

	}

	@Description("设置MarkX")
	public void SetMarkX(int _marker, double _val) {
		String cmdstr = "CALC:MARK" + _marker + ":X " + _val + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
	}

	@Description("获取DetlaMarkX")
	public String GetDeltMarkX(int _marker) {
		String cmdstr = "CALC:DELT" + _marker + "?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr).trim();
		if (tmpstr.contains("1")) {
			cmdstr = "CALC:DELT" + _marker + ":X:REL?\n";
			tmpstr = this.m_ioCtrl.queryString(cmdstr).trim();
			if (tmpstr == "") {
				tmpstr = "0";
			}
			return conversion(tmpstr);
		} else {
			return "0";
		}
	}

	@Description("设置DetlaMarkX")
	public void SetDeltMarkX(int _marker, double _val) {
		String cmdstr = "CALC:DELT" + _marker + ":X " + _val + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.SetMarkerX(_marker, _val);
	}

	@Description("设置markX_PN")
	public void SetMarkX_PN(int _marker, double _val) {
		String cmdstr = "CALC:LPL:MARK" + _marker + ":X " + _val + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.SetMarkerX(_marker, _val);
	}

	@Description("获取MarkX")
	public String GetMarkX(int _marker) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + "?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr).trim();

		if (tmpstr.trim().contains("1")) {
			cmdstr = "CALC:MARK" + _marker + ":X?\n";
			tmpstr = this.m_ioCtrl.queryString(cmdstr).trim();
			if (tmpstr == "") {
				tmpstr = "0";
			}
			return conversion(tmpstr);
		} else {
			return "0";
		}
	}

	@Description("获取MarkX_PN")
	public double GetMarkX_PN(int _marker) throws Exception {
		String cmdstr = "CALC:LPL:MARK" + _marker + ":X?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("获取MarkY")
	public double GetMarkY(int _marker) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + ":Y?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("获取MarkY_PN")
	public double GetMarkY_PN(int _marker) throws Exception {
		String cmdstr = "CALC:LPL:MARK" + _marker + ":Y?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("获取Marker模式")
	public String GetMarkerMode(int _marker) {
		String cmdstr = "CALC:MARK" + _marker + ":MODE?\n";
		String tmp = this.m_ioCtrl.queryString(cmdstr);

		if (tmp.indexOf("POS") != -1) {
			// AnalyzerData.SetMarkerMode(_marker, MarkerMode.POS);
		} else if (tmp.indexOf("DELT") != -1) {
			// AnalyzerData.SetMarkerMode(_marker, MarkerMode.DELT);
		} else if (tmp.indexOf("BAND") != -1) {
			// AnalyzerData.SetMarkerMode(_marker, MarkerMode.BAND);
		} else if (tmp.indexOf("SPAN") != -1) {
			// AnalyzerData.SetMarkerMode(_marker, MarkerMode.SPAN);
		}
		return tmp;
	}

	@Description("设置Peak")
	public void SetToPeak(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":MAX\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	@Description("判断marker是否停止")
	public double GetMarkerStop(int _marker) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + ":X:STOP?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	@Description("设置Marker模式")
	public void SetMarkerModeStr(int _marker, String _val) {
		String cmdstr = "CALC:MARK" + _marker + ":MODE " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.SetMarkerMode(_marker, (MarkerMode)
		// Enum.Parse(typeof(MarkerMode), _val));
	}

	// public void SetMarkerMode(int _marker, MarkerMode _val) {
	// String cmdstr = "CALC:MARK" + _marker + ":MODE " + _val + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.Marker = _marker;
	// AnalyzerData.SetMarkerMode(_marker, _val);
	// }

	@Description("修改Mark为CF")
	public void SetMarkToCF(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":FUNC:CENT\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.MarkerTo = _val;
	}

	// Marker->Start
	@Description("启动mark")
	public void SetMarkToStart(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":START\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	// Marker->Stop
	@Description("停止mark")
	public void SetMarkToStop(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":STOP\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	// Marker->CF Step
	@Description("修改mark为CF step")
	public void SetMarkToCFStep(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":STEP\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	// Marker->Ref Lvl
	@Description("修改mark为Ref Lvl")
	public void SetMarkToRefLv1(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":RLEV\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	// Marker Del->Span
	@Description("修改Marker Del为Span")
	public void SetMkrSpan(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":DELT:SPAN\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	// Marker Del->CF
	@Description("修改Marker Del为CF")
	public void SetMkrCF(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":DELT:CENT\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	@Description("查找下一个peak")
	public void SetNextPeak(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":MAX:NEXT\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	@Description("向右查找next peak")
	public void SetNextPeakRight(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":MAX:RIGH\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	@Description("向左查找next peak")
	public void SetNextPeakLeft(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":MAX:LEFT\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	@Description("查找最小peak")
	public void SetMinSearch(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":MIN\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	@Description("为PK to PkSearch")
	public void SetPkPkSearch(int _val) {
		String cmdstr = "CALC:MARK" + _val + ":PTP\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _val;
	}

	// Marker Func OFF/BPOW/NOIS/BDEN
	@Description("设置marker Func模式")
	public void SetMarkerFuncModeStr(int _val, String _mode) {
		String cmdstr = "CALC:MARK" + _val + ":FUNC:NOIS " + _mode + "\n";
		if (_mode.equals("DENS") || _mode.equals("POW")) {
			cmdstr = "CALC:MARK" + _val + ":FUNC:BPOW:STAT ON \n";
			this.m_ioCtrl.sendString(cmdstr);
			cmdstr = "CALC:MARK" + _val + ":FUNC:BPOW:MODE " + _mode + "\n";
		} else if (_mode.equals("DELT")) {
			cmdstr = "CALC:DELT" + _val + " ON \n";
			this.m_ioCtrl.sendString(cmdstr);
		} else if (_mode.equals("POS")) {
			cmdstr = "CALC:MARK" + _val + " ON \n";
			this.m_ioCtrl.sendString(cmdstr);
			cmdstr = "CALC:DELT" + _val + " OFF \n";
			this.m_ioCtrl.sendString(cmdstr);
		} else if (_mode.equals("OFF")) {
			cmdstr = "CALC:MARK" + _val + ":STAT OFF\n";
			this.m_ioCtrl.sendString(cmdstr);
			cmdstr = "CALC:MARK" + _val + ":FUNC:NOIS " + _mode + "\n";
			this.m_ioCtrl.sendString(cmdstr);
		}

		// AnalyzerData.Marker = _val;
		// AnalyzerData.MarkerFuncMode = _mode;
	}

	// Marker Func
	// OFF/BPOW/NOIS
	// public void SetMarkerFuncMode(int _val, MarkFuncMode _mode) {
	// String cmdstr = "CALC:MARK" + _val + ":FUNC " + _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.Marker = _val;
	// AnalyzerData.MarkerFuncMode = Convert.ToString(_mode);
	// }

	@Description("获取marker Func 模式")
	public String GetMarkerFuncMode(int _val) throws Exception {
//		String cmdstr = "CALC:MARK" + _val + ":FUNC?\n";
		String tmpstr = this.m_ioCtrl.queryString("CALC:MARK" + _val + ":FUNC?\n");
		return tmpstr;

	}

	// Marker Noise 注意：调用此方法之前应该先调用SetMarkerNoise的方法
	@Description("获取marker noise")
	public double GetMarkerNoise(int _marker) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + ":Y?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		double tmp = new Double(tmpstr);
		return tmp;
	}

	// Band/Intvl Power 注意：调用此方法之前应该先调用SetMarkerBPower的方法
	@Description("获取markerBPower")
	public double GetMarkerBPower(int _marker) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + ":Y?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.SetBandIntvlPower(_marker, tmp);
		// AnalyzerData.Marker = _marker;
		return tmp;
	}

	@Description("获取bandSpan")
	public String GetBandSpan(int _val) throws Exception {
		String cmdstr = ":CALC:MARK" + _val + ":FUNC:BPOW:SPAN?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr).trim();
		return conversion(tmpstr);
	}

	@Description("bandSpan设置")
	public void SetBandSpan(int _val, double val) {
		String cmdstr = ":CALC:MARK" + _val + ":FUNC:BPOW:SPAN " + val + " \n";
		this.m_ioCtrl.sendString(cmdstr);
	}

	@Description("marker count 开关")
	public void SetMarkerCountState(int _marker, Boolean _isON) {
		String cmdstr = "";
		if (_isON) {
			cmdstr = "CALC:MARK" + _marker + ":FCO ON\n";
		} else {
			cmdstr = "CALC:MARK" + _marker + ":FCO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.MarkerCntState = _isON;
	}

	@Description("markerCount是否被激活")
	public int GetMarkerCountState(int _marker) {
		String cmdstr = "CALC:MARK" + _marker + ":FCO?\n";
		int tmp = this.queryInt(cmdstr);
		// AnalyzerData.MarkerCnt = tmp;
		// AnalyzerData.Marker = _marker;
		return tmp;
	}

	@Description("获取markerCount")
	public int GetMarkerCount(int _marker) {
		String cmdstr = "CALC:MARK" + _marker + ":FCO:X?\n";
		int tmp = this.queryInt(cmdstr);
		// AnalyzerData.MarkerCnt = tmp;
		return tmp;
	}

	@Description("gateTImeAuto开关")
	public void SetGateTimeAuto(Boolean _isON) {
		String cmdstr = "";
		if (_isON) {
			cmdstr = "CALC:MARK:FCO:GAT:AUTO ON\n";
		} else {
			cmdstr = "CALC:MARK:FCO:GAT:AUTO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.GateTimeAuto = _isON;
	}

	@Description("获取gateTimeAuto状态")
	public boolean GetGateTimeAuto() {
		String cmdstr = "CALC:MARK:FCO:GAT:AUTO?\n";
		int tmp = this.queryInt(cmdstr);
		boolean result = false;
		if (tmp > 0) {
			result = true;
		}
		// AnalyzerData.GateTimeAuto = result;
		return result;
	}

	@Description("设置gateTime")
	public void SetGateTime(double _val) {
		String cmdstr = "CALC:MARK:FCO:GAT " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.GateTime = _val;
	}

	@Description("获取gateTime")
	public double GetGateTime() throws Exception {
		String cmdstr = "CALC:MARK:FCO:GAT?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.GateTime = tmp;
		return tmp;
	}

	@Description("启动marker")
	public void SetMarkerStart(int _marker, double _val) {
		String cmdstr = "CALC:MARK" + _marker + ":X:START " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.DeltaPairRef = _val;
	}

	@Description("marker是否开启")
	public double GetMarkerStart(int _marker) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + ":X:START?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.DeltaPairRef = tmp;
		return tmp;
	}

	@Description("marker关闭")
	public void SetMarkerStop(int _marker, double _val) {
		String cmdstr = "CALC:MARK" + _marker + ":X:STOP " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.DeltaPairDelta = _val;
	}

	@Description("span pair center")
	public void SetSpanCent(int _marker, double fval) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + ":X:CENT " + fval + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.SpanPairCenter = fval;
	}

	@Description("设置marker span")
	public void SetMarkerSpan(int _marker, double _val) {
		String cmdstr = "CALC:MARK" + _marker + ":X:SPAN " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.SpanPairSpan = _val;
	}

	@Description("获取marker span")
	public double GetMarkerSpan(int _marker) throws Exception {
		String cmdstr = "CALC:MARK" + _marker + ":X:SPAN?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.Marker = _marker;
		// AnalyzerData.SpanPairSpan = tmp;
		return tmp;
	}

	@Description("修改ABAuto状态")
	public void SetABAuto(Boolean _isOn) {
		String cmdstr = "AVER:TYPE:AUTO " + (_isOn ? 1 : 0) + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.AvgVBWAuto = _isOn;
	}

	@Description("获取ABAuto")
	public boolean GetABAuto() {
		boolean result = false;
		String cmdstr = "AVER:TYPE:AUTO?\n";
		int tmp = this.queryInt(cmdstr);
		if (tmp > 0) {
			result = true;
		}
		// AnalyzerData.AvgVBWAuto = result;
		return result;
	}

	// public void SetABMode(ABMode _val) {
	// String cmdstr = "AVER:TYPE " + _val + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.AvgVBWMode = Convert.ToString(_val);
	// }

	@Description("获取ABMode")
	public String GetABMode() {
		String cmdstr = "AVER:TYPE?\n";
		String tmp = this.m_ioCtrl.queryString(cmdstr);
		// AnalyzerData.AvgVBWMode = tmp;
		return tmp;
	}

	@Description("修改SRAuto状态")
	public void SetSRAuto(Boolean _isOn) {
		String cmdstr = "AVER:TYPE:AUTO " + (_isOn ? 1 : 0) + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.SpanRBWAuto = _isOn;
	}

	@Description("获取SRAuto状态")
	public boolean GetSRAuto() {
		boolean result = false;
		String cmdstr = "FREQ:SPAN:BAND:RAT:AUTO?\n";
		int tmp = this.queryInt(cmdstr);
		if (tmp > 0) {
			result = true;
		}
		// AnalyzerData.SpanRBWAuto = result;
		return result;
	}

	@Description("设置SR")
	public void SetSR(int _val) {
		String cmdstr = "FREQ:SPAN:BAND:RAT " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.SpanRBW = _val;
	}

	@Description("获取SR")
	public int GetSR() {
		String cmdstr = "FREQ:SPAN:BAND:RAT?\n";
		int tmp = this.queryInt(cmdstr);
		// AnalyzerData.SpanRBW = tmp;
		return tmp;
	}

	// / <summary>
	// / Presel Adjust Mode
	// / 输入值为 MWAVe|MMWave|EXTernal
	// / </summary>
	// public void SetPreselAdjustMode(PreselAdjustMode _val) {
	// String cmdstr = "POW:PADJ:PRES " + _val + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.PreselAdjustMode = Convert.ToString(_val);
	// }

	@Description("presel Adjust Mode")
	public String GetPreselAdjustMode() {
		String cmdstr = "POW:PADJ:PRES?\n";
		String tmp = this.m_ioCtrl.queryString(cmdstr);
		// AnalyzerData.PreselAdjustMode = tmp;
		return tmp;
	}

	@Description("Y Axis Units")
	public void SetYAxisUnits(String str) {
		String cmdstr = "UNIT:POW " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.YAxisUnits = str;
	}

	// / <summary>
	// / Y Axis Units
	// / </summary>
	// public void SetYAxisUnits(PowerUnit _unit)
	// {
	// String cmdstr = "UNIT:POW " + _unit.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.YAxisUnits = Convert.ToString(_unit);
	// }

	// Continue on/off
	@Description("continue 开关")
	public void SetContinuePK(String str) {
		String cmdstr = "CALC:MARK:CPE " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Continue = str;
	}

	// / <summary>
	// / Continue on/off
	// / </summary>
	// / <param name="_mode"></param>
	// public void SetContinuePK(SwitchUnit _mode)
	// {
	// String cmdstr = "CALC:MARK:CPE " + _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.Continue = Convert.ToString(_mode);
	// }

	@Description("peak search Param/Max")
	public void SetPkSearch(String str) {
		String cmdstr = "CALC:MARK:PEAK:SEAR:MODE " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.PeakSearch = str;
	}

	// peak search Param/Max
	// public void SetPkSearch(PkSearch _mode)
	// {
	// String cmdstr = "CALC:MARK:PEAK:SEAR:MODE " + _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.PeakSearch = Convert.ToString(_mode);
	// }

	@Description("修改table状态")
	public void SetTable(Boolean _isOn) {
		String cmdstr = "CALC:MARK:TABLE:STAT " + (_isOn ? 1 : 0) + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Table = _isOn;
	}

	@Description("获取table状态")
	public boolean GetTable() {
		boolean result = false;
		String cmdstr = "CALC:MARK:TABLE:STAT?\n";
		int tmp = this.queryInt(cmdstr);
		if (tmp > 0) {
			result = true;
		}
		// AnalyzerData.Table = result;
		return result;
	}

	@Description("marker Trace Auto")
	public void SetMarkerTraceAuto(String str) {
		String cmdstr = "CALC:MARK%d:TRAC:AUTO " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.MarkerTrace = str;
	}

	// / <summary>
	// / Marker Trace Auto
	// / </summary>
	// public void SetMarkerTraceAuto(SwitchUnit _mode) {
	// String cmdstr = "CALC:MARK%d:TRAC:AUTO " + _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.MarkerTrace = Convert.ToString(_mode);
	// }

	@Description("获取trace数据")
	public byte[] GetTraceData() {
		String strFeedback = this.m_ioCtrl.queryString("trace:data? trace1\n");
		String[] str = strFeedback.split(",");
		byte[] val = new byte[str.length * 8];

		for (int i = 0; i < str.length; i++) {
			byte[] valByte = str[i].getBytes();
			System.arraycopy(valByte, 0, val, i * 8, 8);
		}
		// AnalyzerData.TraceData = val;
		return val;
	}

	@Description("获取trace")
	public Object GetTrace() {
		return this.m_ioCtrl.queryString("trace:data? trace1\n");
	}

	@Description("SASelectTrace")
	public void SASelectTrace(String str) {
		String cmdstr = ":TRAC " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Trace = str;
	}

	@Description("PNSelectTrace")
	public void PNSelectTrace(String str) {
		String cmdstr = ":MMEMory:STORe:TRACe:DATA " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
	}

	@Description("修改Trace")
	public void SetTrace(String str) {
		String cmdstr = "TRAC:MODE " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Trace = str;
	}

	// public void SetTrace(TraceMode _mode) {
	// String cmdstr = "TRAC:MODE " + _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.Trace = Convert.ToString(_mode);
	// }

	@Description("修改SATrace类型")
	public void SetSATraceType(int val, String str) {
		String cmdstr = "DISP:TRAC" + val + ":MODE " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Trace = str;
	}

	@Description("View Blank")
	public void SetViewBlank(int val, String str) {
		String cmdstr = "";
		String cmdstr1 = "";
		if (str.equals("Active")) {
			cmdstr = "TRAC" + val + ":UPD " + "ON" + "\n";
			cmdstr1 = "TRAC" + val + ":DISP " + "ON" + "\n";
		} else if (str.equals("View")) {
			cmdstr = "DISP:TRAC" + val + ":MODE " + "VIEW" + "\n";

		} else if (str.equals("Blank")) {
			cmdstr = "DISP:TRAC" + val + ":MODE " + "BLAN" + "\n";
		} else if (str.equals("Background")) {
			cmdstr = "TRAC" + val + ":UPD " + "ON" + "\n";
			cmdstr1 = "TRAC" + val + ":DISP " + "ON" + "\n";
		}

		this.m_ioCtrl.sendString(cmdstr);

		// AnalyzerData.Trace = str;
	}

	@Description("获取 AVERAGE次数")
	public int GetSATraceTime() throws Exception {
		String cmdstr = "SWE:COUN?\n";
		return this.queryInt(cmdstr);
	}

	@Description("设置 AVERAGE次数")
	public void SetSATraceTime(double val) {
		String cmdstr = "SWE:COUN " + val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
	}

	@Description("修改PNTrace类型")
	public void SetPNTraceType(int val, String _type) {
		String cmdstr = "TRAC" + val + ":LPL:TYPE " + _type + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Trace = Convert.ToString(_type);
	}

	@Description("修改AverageType类型")
	public void SetAverageType(String _mode) {
		String cmdstr = "AVER:TYPE:AUTO " + _mode + "\n";
		this.m_ioCtrl.sendString(cmdstr);

	}

	@Description("Atten Step")
	public void SetAtt(int val) {
		String cmdstr = "POW:ATT:STEP " + val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.AttenStep = val;
	}

	@Description("marker all off")
	public void SetMarkerAllOff() {
		String cmdstr = "CALC:MARK:AOFF\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.SetMarkerAllOff();
	}

	@Description("select marker")
	public void SetSelectMarker(int val) {
		selectmarker = val;
		String cmdstr = "CALC:MARK" + val + ":STAT ON\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = val;
	}

	@Description("select marker_PN")
	public void SetSelectMarker_PN(int val) {
		String cmdstr = "CALC:LPL:MARK" + val + ":STAT ON\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = val;
	}

	@Description("meas开关")
	public void SetMeas(String str) {
		String cmdstr = ":INIT:CONT " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Meas = str;
	}

	// / <summary>
	// / Meas On/Off
	// / </summary>
	// / <param name="_mode"></param>
	// public void SetMeas(SwitchUnit _mode)//
	// {
	// String cmdstr = ":INIT:CONT " + _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.Meas = Convert.ToString(_mode);
	// }

	@Description("设置meas模式为channelPower")
	public void SetChannelPower() {
		String cmdstr = ":INIT:CHPower\n";
		m_ioCtrl.sendString(cmdstr);
	}

	@Description("获取ChannelPower模式下的值")
	public double GetChannelPower() throws Exception {
		String cmdstr = ":FETC:CHPower:CHPower?\n";
		double tmp = this.queryDouble(cmdstr);
		// tmp = Math.Round(tmp, 2);
		return tmp;
	}

	@Description("设置IntegBW")
	public void SetIntegBW(double span) {
		String cmdstr = "CHP:BAND:INT " + span + "Hz\n";
		m_ioCtrl.sendString(cmdstr);
	}

	@Description("获取IntegBW")
	public double GetIntegBW() throws Exception {
		String cmdstr = "CHP:BAND:INT?\n";
		double tmp = this.queryDouble(cmdstr);
		return tmp;
	}

	@Description("marker tracel")
	public void SetMarkerTrace(int val, int t) {
		String cmdstr = "CALC:MARK" + val + ":TRAC " + t + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = val;
		// AnalyzerData.MarkerTrace1 = t;
	}

	// Presel Adjust,默认单位Hz
	@Description("presel adjust")
	public void SetAjust(double val) {
		String cmdstr = "POW:PADJ " + val + " hz\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.PreselAdjust = val;
	}

	// / <summary>
	// / Presel Adjust,带单位
	// / </summary>
	// public void SetAjust(double val, FrequencyUnit _unit) {
	// String cmdstr = "POW:PADJ " + val + " " + _unit.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.PreselAdjust = val;
	// }

	@Description("Presel Adjust")
	public double GetAjust() throws Exception {
		String cmdstr = "POW:PADJ?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.PreselAdjust = tmp;
		return tmp;
	}

	@Description("Ref Lvl Offset")
	public void SetRefOffset(double val) {
		String cmdstr = "DISP:WIND:TRAC:Y:RLEV:OFFS " + val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.RefLvlOffst = val;
	}

	@Description("获取Ref Lvl Offset")
	public double GetRefOffset() throws Exception {
		String cmd = "DISP:WIND:TRAC:Y:RLEV:OFFS?\n";
		double tmp = this.queryDouble(cmd);
		// AnalyzerData.RefLvlOffst = tmp;
		return tmp;
	}

	@Description("Ext Amp Gain")
	public void SetExt(double val) {
		String cmdstr = "CORR:OFFS:MAGN " + val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.ExtAmpGain = val;
	}

	@Description("获取Ext")
	public double GetExt() throws Exception {
		String cmdstr = "CORR:OFFS:MAGN?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.ExtAmpGain = tmp;
		return tmp;
	}

	@Description("Max Mixer Lvl")
	public void SetMax(double val) {
		String cmdstr = "POW:MIX:RANG " + val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.MaxMixerLvl = val;
	}

	@Description("获取Max")
	public double GetMax() throws Exception {
		String cmdstr = "POW:MIX:RANG?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.MaxMixerLvl = tmp;
		return tmp;
	}

	@Description("Peak Excursn")
	public void SetPeakExcursn(double val) {
		String cmdstr = ":CALC:MARK:PEAK:EXC " + val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.PeakExcursn = val;
	}

	@Description("获取Peak Excursn")
	public double GetPeakExcursus() throws Exception {
		String cmdstr = ":CALC:MARK:PEAK:EXC?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.PeakExcursn = tmp;
		return tmp;
	}

	@Description("peak Threshold")
	public void SetPkThreshold(double val) {
		String cmdstr = "CALC:MARK:PEAK:THR " + val + "dBm\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.PeakThreshold = val;
	}

	@Description("获取peak Threshold")
	public double GetPkThreshold() throws Exception {
		String cmdstr = "CALC:MARK:PEAK:THRESHOLD?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.PeakThreshold = tmp;
		return tmp;
	}

	@Description("singnal Trace")
	public void SetSingnalTrack(int val, String str) {
		String cmdstr = ":CALC:MARK" + val + ":TRCK " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = val;
		// AnalyzerData.SingnalTrackMode = str;
	}

	@Description("Singnal Trace_Pn")
	public void SetSingnalTrack_PN(int val, String str) {
		String cmdstr = ":CALC:LPL:MARK" + val + ":TRCK " + str + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.Marker = val;
		// AnalyzerData.SingnalTrackMode = str;
	}

	// public void SetSingnalTrack_old(int val, SwitchUnit _mode) {
	// String cmdstr = ":CALC:MARK" + val + ":TRCK " + _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.Marker = val;
	// AnalyzerData.SingnalTrackMode = Convert.ToString(_mode);
	// }

	@Description("获取Singnal Tracek")
	public double GetSingnalTrack(int x) throws Exception {
		String cmd = ":CALC:MARK" + x + ":TRCK ? \n";
		double tmp = this.queryDouble(cmd);
		// AnalyzerData.SingnalTrack = tmp;
		// AnalyzerData.Marker = x;
		return tmp;
	}

	@Description("获取Att类型")
	public String GetAttType() {
		String cmdstr = "POW:ATT:STEP?\n";
		String tmp = this.m_ioCtrl.queryString(cmdstr);
		// AnalyzerData.AttType = tmp;
		return tmp;
	}

	@Description("获取Average类型")
	public boolean GetAvergeTypeAuto() {
		boolean result = false;
		String cmdstr = "AVER:TYPE AUTO?\n";
		int tmp = this.queryInt(cmdstr);
		if (tmp > 0) {
			result = true;
		}
		// AnalyzerData.AvergeTypeAuto = result;
		return result;
	}

	@Description("Power Spectral Density")
	public double GetPowerSpectralDen() throws Exception {
		String cmdstr = ":FETC:CHP:DENS?\n";
		double tmp = this.queryDouble(cmdstr);
		// AnalyzerData.PowerSpectralDensity = tmp;
		return tmp;
	}

	@Description("修改Power GAIN")
	public void SetIntType(Boolean _isOn) {
		String cmdstr = "POW:GAIN " + (_isOn ? 1 : 0) + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.IntPteamp = _isOn;
	}

	@Description("获取Power GAIN")
	public boolean GetIntType() {
		boolean result = false;
		String cmdstr = "POW:GAIN?\n";
		int tmp = queryInt(cmdstr);
		if (tmp > 0) {
			result = true;
		}
		// AnalyzerData.IntPteamp = result;
		return result;
	}

	// / <summary>
	// / Read out
	// / </summary>
	// / <param name="_marker"></param>
	// / <param name="_mode"></param>
	// public void SetReadout(int _marker, Readout _mode) {
	// String cmdstr = ":CALC:MARK" + _marker.ToString() + ":X:READ " +
	// _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.Marker = _marker;
	// AnalyzerData.ReadOutMode = Convert.ToString(_mode);
	// }

	@Description("read out")
	public int GetReadout(int _marker) {
		String cmdstr = "CALC:MARK" + _marker + ":MODE?\n";
		int tmp = this.queryInt(cmdstr);
		// AnalyzerData.ReadOut = tmp;
		// AnalyzerData.Marker = _marker;
		return tmp;
	}

	// public void SetAverageType(int _marker, AverageType _mode) {
	// String cmdstr = ":CALC:MARK" + _marker.ToString() + ":X:READ " +
	// _mode.ToString() + "\n";
	// this.m_ioCtrl.sendString(cmdstr);
	// AnalyzerData.Marker = _marker;
	// AnalyzerData.AverageType = Convert.ToString(_mode);
	// }

	@Description("获取average类型")
	public int GetAverageType(int _marker) {
		String cmdstr = "CALC:MARK" + _marker + ":MODE?\n";
		int tmp = this.queryInt(cmdstr);
		// AnalyzerData.AverageTypeValue = tmp;
		// AnalyzerData.Marker = _marker;
		return tmp;
	}

	@Description("sweep mode autp开关")
	public void SetSweepModeAuto(String _isAuto) {

		String cmdstr = "SWE:TYPE " + _isAuto + "\n";

		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.SweepModeAuto = _isAuto;
	}

	@Description("sweep time auto 开关")
	public void SetSweepTimeAuto(Boolean _isOn) {
		String cmdstr = "";
		if (_isOn) {
			cmdstr = "SWE:TIME:AUTO ON\n";
		} else {
			cmdstr = "SWE:TIME:AUTO OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.SweepTimeAuto = _isOn;
	}

	@Description("获取sweep time auto 状态")
	public boolean GetSweepTimeAuto() {
		String cmdstr = "SWE:TIME:AUTO?\n";
		int tmp = this.queryInt(cmdstr);
		boolean result = false;
		if (tmp > 0) {
			result = true;
		}
		// AnalyzerData.SweepTimeAuto = result;
		return result;
	}

	@Description("修改扫描时间")
	public void SetSweepTime(double _val) {
		String cmdstr = "SWE:TIME " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.SweepTime = _val;
	}

	@Description("获取扫描时间")
	public double GetSweepTime() throws Exception {
		String cmdstr = "SWE:TIME?\n";

		double tmp = this.queryDouble(cmdstr);
//		tmp = tmp * 1000000;
//		NumberFormat ddf = NumberFormat.getNumberInstance();
//		ddf.setMaximumFractionDigits(1);
		// AnalyzerData.SweepTime = tmp;
		return tmp;
	}

	@Description("设置扫描点")
	public void SetSweepPoints(int _val) {
		String cmdstr = "SWE:POIN " + _val + "\n";
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.SweepPoints = _val;
	}

//0.00001264134
	@Description("获取扫描点")
	public int GetSweepPoints() {
		String cmdstr = "SWEep:POINts?\n";
		int tmp = this.queryInt(cmdstr);
		// AnalyzerData.SweepPoints = tmp;
		return tmp;
	}

	@Description("Full Screen开关")
	public void SetFullScreen(Boolean _isOn) {
		String cmdstr = "";
		if (_isOn) {
			cmdstr = "DISP:FSCR ON\n";
		} else {
			cmdstr = "DISP:FSCR OFF\n";
		}
		this.m_ioCtrl.sendString(cmdstr);
		// AnalyzerData.FullScreen = _isOn;
	}

	@Description("获取Full Screen")
	public boolean GetFullScreen() {
		String cmdstr = "DISP:FSCR?\n";
		String tmpstr = this.m_ioCtrl.queryString(cmdstr);
		Integer tmp = new Integer(tmpstr);
		boolean result = false;
		if (tmp > 0) {
			result = true;
		}
		return result;
	}

	// 频谱仪截屏
	private void SetCLS() {
		this.m_ioCtrl.sendString("*CLS\n");
	}

	private byte[] imgBuffer;

	@Description("是否获取Full Screen")
	public void StartScreenshot(boolean isget) {
		isscreen = isget;

		System.out.println(isscreen);

	}

	private static Object objectStaticLock = new Object();

	public int PrintScreen(ByteArrayInputStream mem, String _name) throws Exception {
		int readCount = 0;
		imgBuffer = new byte[50000000];
		try {
			this.m_ioCtrl.sendString("HCOP:DEV:LANG PNG");
			this.m_ioCtrl.sendString("HCOP:DEST'MMEM'");
			this.m_ioCtrl.sendString("MMEM:SEL:HWS ON");
			this.m_ioCtrl.sendString("MMEM:NAME " + _name);
			this.m_ioCtrl.sendString("HCOP");
			synchronized (this) {
				this.m_ioCtrl.sendString(":MMEM:DATA? " + _name);
				readCount = this.m_ioCtrl.ReadBuffers_Img(imgBuffer);
				SetCLS();
			}
			byte[] ImgBuffer2 = new byte[readCount];
			if (readCount >= 7) {
				ImgBuffer2 = new byte[readCount - 7];// 收到的数据后8位是结束标志位，在读取ReadBuffers_Img中判断会用到
			}
			System.arraycopy(imgBuffer, 7, ImgBuffer2, 0, ImgBuffer2.length);
			mem = new ByteArrayInputStream(ImgBuffer2, 0, ImgBuffer2.length);
			BufferedImage bil = ImageIO.read(mem);
			File webappFolderFile = ClasspathResourceUtil.getWebappFolderFile("\\img");

			String string = String.valueOf(new Date().getTime());// _" + string + "
			File file = new File(webappFolderFile + "/ScreenShoot_" + string + ".png");// \common\customportal
			ImageIO.write(bil, "png", file);

			imgStr = "/img/ScreenShoot_" + string + ".png";
		} finally {
			// 删除频谱仪设备上的临时文件
		}
		return readCount;
	}

	// / <summary>
	// / 20170925 add 用在流程执行界面的设备实时显示
	// / </summary>
	// / <param name="memoryStream"></param>
	// / <returns></returns>
	public ByteArrayInputStream PrintScreenForDisplay(ByteArrayInputStream memoryStream) throws Exception {
		PrintScreen(memoryStream, DEFAULT_REMOTE_SAVE_IMAGE_NAME);
		return memoryStream;
	}

	// / <summary>
	// / 截取频谱仪图像到制定目录存放,文件名见类的常量：DEFAULT_LOCAL_SAVE_IMAGE_FILENAME
	// / </summary>
	// / <param name="dir"></param>
	public int printScreenMem(ByteArrayInputStream memoryStream) throws Exception {
		return PrintScreen(memoryStream, DEFAULT_REMOTE_SAVE_IMAGE_NAME);// +DateTime.Now.ToString("yyyyMMddHHmmss")+".png'");
	}

//  public Image GetScreenImg()
//  {
//    Image img = null;
//    MemoryStream tmp_stream = null;
//    int num = PrintScreen(ref tmp_stream, DEFAULT_REMOTE_SAVE_IMAGE_NAME);
//    try
//    {
//      img = Image.FromStream(tmp_stream);
//    }
//    catch
//    { }
//    finally
//    {
//
//    }
//    return img;
//  }

//  public void PrintScreenToFile(String fileName)
//  {
//    MemoryStream memoryStream = new MemoryStream();
//    this.printScreenMem(ref memoryStream);
//    Image.FromStream(memoryStream).Save(fileName);
//  }

	// / <summary>
	// / 截取频谱仪图像到制定目录存放,文件名见类的常量：DEFAULT_LOCAL_SAVE_IMAGE_FILENAME
	// / </summary>
	// / <param name="dir"></param>
//  public int PrintScreenForE9030(ref MemoryStream memoryStream)
//  {
//    return PrintScreen(ref memoryStream, N9030_REMOTE_SAVE_IMAGE_NAME);
//  }

//  public Image GetScreenImgForE9030()
//  {
//    Image img = null;
//    MemoryStream tmp_stream = null;
//    int num = PrintScreenForE9030(ref tmp_stream);
//    byte[] ImgBuffer = new byte[num];
//    try {
//      tmp_stream.Read(ImgBuffer, 0, num);
//      img = Image.FromStream(tmp_stream);
//    }catch(Exception e)
//    {
//
//    }finally
//    {
//      if (tmp_stream != null)
//        tmp_stream.Close();
//    }
//    return img;
//  }

	@Description("设置压力")
	public void SetPresel() {
		this.m_ioCtrl.sendString("POW:PCEN\n\n");
	}

	@Description("PN模式")
	public void SetAutoTune_PN()// PN模式是这个，SA模式应该发FREQ:TUNE:IMM\n//ZJM 加
	{
		this.m_ioCtrl.sendString(":FREQ:CARR:SEAR\n");
	}

	@Description("SA模式")
	public void SetAutoTune_SA()// PN模式是这个，SA模式应该发FREQ:TUNE:IMM\n//ZJM 加
	{
		this.m_ioCtrl.sendString(":FREQ:TUNE:IMM\n");
	}

	@Description("设置CFRmt")
	public void SetCFRmt(String[] prms) throws Exception {
		if (prms.length != 1)
			throw new Exception("参数个数不匹配");
		double val = new Double(prms[0]);
		BigDecimal valBD = new BigDecimal(val);
		int result1 = valBD.compareTo(new BigDecimal(0.0));
		int result2 = valBD.compareTo(new BigDecimal("100000000000"));
		if (result1 < 0 || result2 > 0) {
			throw new Exception("参数超出有效范围");
		}
		this.SetCenterFrequency(val);
	}

	protected int queryInt(String str) {
		try {
			String tmpstr = this.m_ioCtrl.queryString(str);
			if (tmpstr == "") {
				tmpstr = "0";
			}
			int tmp = Integer.parseInt(tmpstr.trim());

			return tmp;
		} catch (Exception er) {
			return 0;
		}
	}

	protected double queryDouble(String str) throws Exception {
		String tmpstr = this.m_ioCtrl.queryString(str);
		if (tmpstr == "") {
			tmpstr = "0";
		}
		double tmp = new Double(tmpstr);
		return tmp;
	}

}
