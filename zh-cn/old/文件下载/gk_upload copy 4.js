define(function (require, exports, module) {

  require("jquery");
  require("widget");
  require("uiutils");
  require("uiplexus");
  require('uicomsearch');
  var _comsearch;
  var isScreenShoting = false;

  exports.buttons = function () {

    return {

      '远控': {
        className: 'btn-remotectrl btn-default',
        click: function (e, closecallback) {
          remoteControlEnable = !remoteControlEnable;
          closecallback(false);
          var targetButton = $(e.target);

          targetButton.addClass('hide-by-class');
          targetButton.parent().find('.btn-localctrl').removeClass('hide-by-class');
          targetButton.parents('.modal-content').find('.remote-enable-only').prop('disabled', false);
        }
      },
      '本控': {
        className: 'btn-localctrl hide-by-class btn-default',
        click: function (e, closecallback) {
          remoteControlEnable = !remoteControlEnable;
          closecallback(false);
          var targetButton = $(e.target);
          targetButton.addClass('hide-by-class');
          targetButton.parent().find('.btn-remotectrl').removeClass('hide-by-class');
          targetButton.parents('.modal-content').find('.remote-enable-only').prop('disabled', true);
        },
      },
      '断开': function (e, closecallback) {

        btnsetparams('pinStop', '1');
        function btnsetparams(operationname, opparams) {

          $.post(ctx + "/signalgeneratordevice/signalgeneratorset.vot", {
            device_sid: str,
            operation_name: operationname,
            op_params: opparams,
          }).done(function (data) {
            console.log(data)
          });
        }


        closecallback(true);
      },
    };
  };
  var remoteControlEnable = false;

  var tdllparams = null;
  var str = null;
  exports.init = function (opts, dllparams) {
    btnsetparams('open', '');
    str = dllparams.params.device;
    var dllparamForm = $(dllparams.formobj);
    dllparamForm.find('.remote-enable-only').prop('disabled', true);
    var btnset = dllparamForm.find('button');

    // 第一个标签第一个
    var real_CenterFrequencyunit_opt = null;
    var real_CenterFrequencyunit_unit = null;
    var SetCenterFrequencyunit_list = $('#SetCenterFrequencyunit')

    // 第一个标签第二个
    var real_Spanunit_opt = null;
    var real_Spanunit_unit = null;
    var SetSpanunit_list = $('#SetSpanunit')

    // 第三个标签第一个
    var real_SweepTime_opt = null;
    var real_SweepTime_unit = null;
    var SetSweepTimeunit_list = $('#SetSweepTimeunit')

    // 第四个标签第一个
    var real_MarkXunit_opt = null;
    var real_MarkXunit_unit = null;
    var SetMarkXunit_list = $('#SetMarkXunit')
    // 第四个标签第二个
    var real_BandSpanunit_opt = null;
    var real_BandSpanunit_unit = null;
    var SetBandSpanunit_list = $('#SetBandSpanunit')
    // 第四个标签第三个
    var real_DeltaMarkXunit_opt = null;
    var real_DeltaMarkXunit_unit = null;
    var SetDeltaMarkXunit_list = $('#SetDeltaMarkXunit')

    // 第五个标签第一个
    var real_ResBWunit_opt = null;
    var real_ResBWunit_unit = null;
    var SetResBWunit_list = $('#SetResBWunit')
    // 第五个标签第二个
    var real_VideoBWunit_opt = null;
    var real_VideoBWunit_unit = null;
    var SetVideoBWunit_list = $('#SetVideoBWunit')







    btnset.on("click", function () {
      debugger;
      var btniditem = $(this).attr('operationmethod');
      var operation = btniditem.split(",");
      if (operation.length > 1) {
        var paramsvalue = dllparamForm.find('#' + operation[1]);
        if (paramsvalue.length > 0) {
          var paramsunit = dllparamForm.find('#' + operation[1] + 'unit');
          if (paramsunit.length > 0) {
            debugger;
            btnsetparams(operation[0], paramsvalue.val() * returndhz(paramsunit.val()));
          } else {
            debugger;
            btnsetparams(operation[0], paramsvalue.val());
          }
        } else {
          debugger;
          btnsetparams(operation[0], '');
        }
      } else {
        var paramsvalue = dllparamForm.find('#' + operation[0]);
        if (paramsvalue.length > 0) {
          var paramsunit = dllparamForm.find('#' + operation[0] + 'unit');
          if (paramsunit.length > 0) {
            debugger;
            btnsetparams(operation[0], paramsvalue.val() * returndhz(paramsunit.val()));
          } else {
            debugger;
            btnsetparams(operation[0], paramsvalue.val());
          }
        } else {
          if (operation[0] == 'StartScreenshot') {
            if (isScreenShoting == false) {
              isScreenShoting = true;
              dllparamForm.find('[operationmethod=StartScreenshot]').text("停止截图");
            }
            else {
              isScreenShoting = false;
              dllparamForm.find('[operationmethod=StartScreenshot]').text("开始刷新");
            }
            btnsetparams(operation[0], isScreenShoting);
          }
          else {
            btnsetparams(operation[0], '');
          }
        }
      }
    });

    function btnsetparams(operationname, opparams) {
      debugger;
      if (operationname == 'SetMarkX'
        || operationname == 'SetDeltMarkX'
        || operationname == 'SetMarkerFuncModeStr'
        || operationname == 'SetBandSpan'
        || operationname == 'SetMarkerMode'
        || operationname == 'SetMarkToCF'
        || operationname == 'SetToPeak'
        || operationname == 'SetNextPeak'
        || operationname == 'SetNextPeakRight'
        || operationname == 'SetNextPeakLeft'
        || operationname == 'SetMinSearch'
        || operationname == 'SetPkPkSearch') {
        if (opparams != '') {
          opparams = dllparamForm.find('#SetSelectMarker').val() + ',' + opparams;
        } else {
          opparams = dllparamForm.find('#SetSelectMarker').val();
        }
      }
      if (operationname == 'SetSATraceType'
        || operationname == 'SetViewBlank') {
        opparams = dllparamForm.find('#selecttrace').val() + ',' + opparams;
      }
      $.post(ctx + "/signalanalyzerdevice/signalanalyzerset.vot", {
        device_sid: dllparams.params.device,
        operation_name: operationname,
        op_params: opparams,
      }).done(function (data) {
        console.log(data)
      });
    }
    function returndhz(cbxhz) {

      if (cbxhz == "GHz") {
        dhz = 1000000000;
      } else if (cbxhz == "MHz") {
        dhz = 1000000;
      } else if (cbxhz == "KHz") {
        dhz = 1000;
      } else if (cbxhz == "Hz") {
        dhz = 1;
      }
      return dhz;
    }
    $.subscribe("auto_device_property_changed_pushkey", function (data) {
      //console.log(data.device_sid,"----",dllparams.params.device,"---------",data.device_sid==dllparams.params.device)
      if (data.device_sid != dllparams.params.device) return;
      var param = dllparamForm.find('input[name=' + data.property_name + ']');
      var set = dllparamForm.find('#' + data.property_name + 'unit');
      /*console.log(data );*/
      // 处于本控模式或者不是远控修改 才更新
      if (!remoteControlEnable || !param.hasClass('remote-enable-only')) {
        /*	if (dllparamForm.find('#' + data.property_name + 'unit').length > 0) {*/
        /*data.property_value = data.property_value / returndhz(dllparamForm.find('#' + data.property_name + 'unit').val());*/
        var aa = data.property_value.split("+");

        if (data.device_sid == str) {
          param.val(aa[0]);
          set.val(aa[1])
          if (data.property_name == "Fullscreensrc") {
            dllparamForm.find('img[id=ppycanvas]').attr("src", ctx + data.property_value);
          } else if (data.property_name == "SetCenterFrequency") {

            //unit
            $('#SetCenterFrequencyunit').val(aa[1]);
            real_CenterFrequencyunit_unit = aa[1];
            real_CenterFrequencyunit_opt = aa[0];
          } else if (data.property_name == "SetSpan") {
            $('#SetSpanunit').val(aa[1]);
            real_Spanunit_unit = aa[1];
            real_Spanunit_opt = aa[0];
          } else if (data.property_name == "SetMarkX") {
            $('#SetMarkXunit').val(aa[1]);
            real_MarkXunit_unit = aa[1];
            real_MarkXunit_opt = aa[0];
          } else if (data.property_name == "SetSweepTime") {
            $('#SetSweepTimeunit').val(aa[1]);
            real_SweepTime_unit = aa[1];
            real_SweepTime_opt = aa[0];
          } else if (data.property_name == "SetBandSpan") {
            $('#SetBandSpanunit').val(aa[1]);
            real_BandSpanunit_unit = aa[1];
            real_BandSpanunit_opt = aa[0];
          } else if (data.property_name == "SetDeltaMarkX") {
            $('#SetDeltaMarkXunit').val(aa[1]);
            real_DeltaMarkXunit_unit = aa[1];
            real_DeltaMarkXunit_opt = aa[0];
          } else if (data.property_name == "SetResBW") {
            $('#SetResBWunit').val(aa[1]);
            real_ResBWunit_unit = aa[1];
            real_ResBWunit_opt = aa[0];
          } else if (data.property_name == "SetVideoBW") {
            $('#SetVideoBWunit').val(aa[1]);
            real_VideoBWunit_unit = aa[1];
            real_VideoBWunit_opt = aa[0];
          } else if (data.property_name == "SetSN") {
            $("[name = 'SetSN']").text(aa[0])
            console.log(aa[0],"123")
          }

        }
      }


    });
    console.log(dllparams.params);
    dllparamForm.find('#lb_input_param').text(
      JSON.stringify(dllparams.params));

    /*		SetCenterFrequencyunit_list.on("change", num_change("#SetCenterFrequencyunit",real_CenterFrequencyunit_unit,real_CenterFrequencyunit_opt,"#SetCenterFrequency"));
      	
        function num_change(select_list_id,unit_,r_opt_,input_id){
          debugger
          if(unit_==null || r_opt_==null) return;
          var opt=$(select_list_id).val();
          var unit = unit_;
          var r_opt = r_opt_;
          cur_opt = returndhz_a(opt,unit)
          var cur_number = Multiply(r_opt,cur_opt)
          $(input_id).val(cur_number);
        }*/
    SetCenterFrequencyunit_list.on("change", function () {
      //单位
      var opt = $('#SetCenterFrequencyunit').val();
      var unit = real_CenterFrequencyunit_unit;
      var r_opt = real_CenterFrequencyunit_opt;

      cur_opt = returndhz_a(opt, unit)
      var cur_number = Multiply(r_opt, cur_opt)
      //输入框
      $('#SetCenterFrequency').val(cur_number);
    });

    SetSpanunit_list.on("change", function () {
      //单位
      var opt = $('#SetSpanunit').val();
      var unit = real_Spanunit_unit;
      var r_opt = real_Spanunit_opt;

      cur_opt = returndhz_a(opt, unit)
      var cur_number = Multiply(r_opt, cur_opt)
      //输入框
      $('#SetSpan').val(cur_number);
    });

    // 时间单位
    SetSweepTimeunit_list.on("change", function () {
      //单位
      // var opt = $('#SetSweepTimeunit').val();
      // var unit = real_SweepTime_opt;
      // var r_opt = real_SweepTime_unit;

      // cur_opt = returndhz_a(opt, unit)
      // var cur_number = Multiply(r_opt, cur_opt)
      // //输入框
      // $('#SweepTime').val(cur_number);
    });


    SetMarkXunit_list.on("change", function () {
      //单位
      var opt = $('#SetMarkXunit').val();
      var unit = real_MarkXunit_unit;
      var r_opt = real_MarkXunit_opt;

      cur_opt = returndhz_a(opt, unit)
      var cur_number = Multiply(r_opt, cur_opt)
      //输入框
      $('#SetMarkX').val(cur_number);
    });


    SetBandSpanunit_list.on("change", function () {
      //单位
      var opt = $('#SetBandSpanunit').val();
      var unit = real_BandSpanunit_unit;
      var r_opt = real_BandSpanunit_opt;

      cur_opt = returndhz_a(opt, unit)
      var cur_number = Multiply(r_opt, cur_opt)
      //输入框
      $('#SetBandSpan').val(cur_number);
    });
    SetDeltaMarkXunit_list.on("change", function () {
      //单位
      var opt = $('#SetDeltaMarkXunit').val();
      var unit = real_DeltaMarkXunit_unit;
      var r_opt = real_DeltaMarkXunit_opt;

      cur_opt = returndhz_a(opt, unit)
      var cur_number = Multiply(r_opt, cur_opt)
      //输入框
      $('#SetDeltaMark').val(cur_number);
    });

    SetResBWunit_list.on("change", function () {
      //单位
      var opt = $('#SetResBWunit').val();
      var unit = real_ResBWunit_unit;
      var r_opt = real_ResBWunit_opt;

      cur_opt = returndhz_a(opt, unit)
      var cur_number = Multiply(r_opt, cur_opt)
      //输入框
      $('#SetResBW').val(cur_number);
    });
    SetVideoBWunit_list.on("change", function () {
      //单位
      var opt = $('#SetVideoBWunit').val();
      var unit = real_VideoBWunit_unit;
      var r_opt = real_VideoBWunit_opt;

      cur_opt = returndhz_a(opt, unit)
      var cur_number = Multiply(r_opt, cur_opt)
      //输入框
      $('#SetVideoBW').val(cur_number);
    });



    function returndhz2(cbxhz) {
      // hz转别的
      var dhz = null;
      if (cbxhz == "GHz") {
        dhz = 0.000000001
      } else if (cbxhz == "MHz") {
        dhz = 0.000001
      } else if (cbxhz == "KHz") {
        dhz = 0.001
      } else if (cbxhz == "Hz") {
        dhz = 1
      }
      return dhz;
    }
    function returndhz_ghz(cbxhz) {
      // ghz转别的
      var dhz = null;
      if (cbxhz == "GHz") {
        dhz = 1
      } else if (cbxhz == "MHz") {
        dhz = 100
      } else if (cbxhz == "KHz") {
        dhz = 1000000
      } else if (cbxhz == "Hz") {
        dhz = 1000000000
      }
      return dhz;
    }
    function returndhz_mhz(cbxhz) {
      // mhz转别的
      var dhz = null;
      if (cbxhz == "GHz") {
        dhz = 0.0001
      } else if (cbxhz == "MHz") {
        dhz = 1
      } else if (cbxhz == "KHz") {
        dhz = 1000
      } else if (cbxhz == "Hz") {
        dhz = 1000000
      }
      return dhz;
    }
    function returndhz_khz(cbxhz) {
      // khz转别的
      var dhz = null;
      if (cbxhz == "GHz") {
        dhz = 0.0000001
      } else if (cbxhz == "MHz") {
        dhz = 0.0001
      } else if (cbxhz == "KHz") {
        dhz = 1
      } else if (cbxhz == "Hz") {
        dhz = 1000
      }
      return dhz;
    }


    function returndhz_a(cbxhz, real_freqcw_unit) {
      var dhz = null;
      if (real_freqcw_unit == "GHz") {
        dhz = returndhz_ghz(cbxhz);
      } else if (real_freqcw_unit == "MHz") {
        dhz = returndhz_mhz(cbxhz);
      } else if (real_freqcw_unit == "KHz") {
        dhz = returndhz_khz(cbxhz)
      } else if (real_freqcw_unit == "Hz") {
        dhz = returndhz2(cbxhz);
      }
      return dhz;
    }


    function Multiply(arg1, arg2) {

      var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
      try { m += s1.split(".")[1].length } catch (e) { }
      try { m += s2.split(".")[1].length } catch (e) { }
      console.log("数字1:", Number(s1.replace(".", "")), "数字2:", Number(s2.replace(".", "")), "-----------", Math.pow(10, m), "---", m)
      return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
    }


    //--	

  }
});