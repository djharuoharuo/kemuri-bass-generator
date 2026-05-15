{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 9,
			"minor" : 0,
			"revision" : 10,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 1254.0, 561.0, 760.0, 560.0 ],
		"openinpresentation" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"boxes" : [ 			{
				"box" : 				{
					"fontface" : 1,
					"fontsize" : 14.0,
					"id" : "lbl-title",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 10.0, 380.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 3.0, 380.0, 16.0 ],
					"text" : "🎵  KemuriBeat Bass Generator"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 11.0,
					"id" : "lbl-style",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 42.0, 45.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 21.0, 38.0, 14.0 ],
					"text" : "Style"
				}

			}
, 			{
				"box" : 				{
					"id" : "menu-style",
					"maxclass" : "live.menu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 60.0, 38.0, 120.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 19.0, 110.0, 15.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "Boom-Bap", "Soul-Jazz", "Funk", "Lo-Fi" ],
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Style",
							"parameter_mmax" : 3,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Style",
							"parameter_type" : 2
						}

					}
,
					"varname" : "live.menu"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 11.0,
					"id" : "lbl-root",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 195.0, 42.0, 35.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 168.0, 21.0, 30.0, 14.0 ],
					"text" : "Root"
				}

			}
, 			{
				"box" : 				{
					"id" : "menu-root",
					"maxclass" : "live.menu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 233.0, 38.0, 75.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 200.0, 19.0, 65.0, 15.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ],
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Root",
							"parameter_mmax" : 11,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Root",
							"parameter_type" : 2
						}

					}
,
					"varname" : "live.menu[1]"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 11.0,
					"id" : "lbl-mode",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 315.0, 42.0, 40.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 272.0, 21.0, 32.0, 14.0 ],
					"text" : "Mode"
				}

			}
, 			{
				"box" : 				{
					"id" : "menu-mode",
					"maxclass" : "live.menu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 358.0, 38.0, 80.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 307.0, 19.0, 75.0, 15.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "Major", "Minor" ],
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Mode",
							"parameter_mmax" : 1,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Mode",
							"parameter_type" : 2
						}

					}
,
					"varname" : "live.menu[2]"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 11.0,
					"id" : "lbl-comp",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 78.0, 80.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 37.0, 68.0, 13.0 ],
					"text" : "Complexity"
				}

			}
, 			{
				"box" : 				{
					"id" : "dial-comp",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 10.0, 98.0, 50.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 51.0, 38.0, 38.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_initial" : [ 30 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Complexity",
							"parameter_mmax" : 100.0,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Comp",
							"parameter_type" : 1,
							"parameter_unitstyle" : 0
						}

					}
,
					"varname" : "live.dial"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "lbl-comp2",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 65.0, 112.0, 120.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 51.0, 64.0, 80.0, 12.0 ],
					"text" : "Simple ←→ Dynamic"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 11.0,
					"id" : "lbl-fill",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 220.0, 78.0, 35.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 120.0, 37.0, 25.0, 13.0 ],
					"text" : "Fill"
				}

			}
, 			{
				"box" : 				{
					"id" : "dial-fill",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 220.0, 98.0, 50.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 120.0, 51.0, 38.0, 38.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_initial" : [ 20 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Fill",
							"parameter_mmax" : 100.0,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Fill",
							"parameter_type" : 1,
							"parameter_unitstyle" : 0
						}

					}
,
					"varname" : "live.dial[1]"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "lbl-fill2",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 275.0, 112.0, 100.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 161.0, 64.0, 70.0, 12.0 ],
					"text" : "Root ←→ Fill"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 11.0,
					"id" : "lbl-bars",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 175.0, 40.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 220.0, 37.0, 28.0, 13.0 ],
					"text" : "Bars"
				}

			}
, 			{
				"box" : 				{
					"id" : "menu-bars",
					"maxclass" : "live.menu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 55.0, 172.0, 75.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 220.0, 51.0, 65.0, 15.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "4", "8", "16" ],
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Bars",
							"parameter_mmax" : 2,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Bars",
							"parameter_type" : 2
						}

					}
,
					"varname" : "live.menu[3]"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 11.0,
					"id" : "lbl-slot",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 150.0, 175.0, 65.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 300.0, 37.0, 50.0, 13.0 ],
					"text" : "Clip Slot"
				}

			}
, 			{
				"box" : 				{
					"id" : "num-slot",
					"maxclass" : "live.numbox",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 218.0, 172.0, 50.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 300.0, 51.0, 45.0, 15.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "ClipSlot",
							"parameter_mmax" : 7.0,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Slot",
							"parameter_type" : 1,
							"parameter_unitstyle" : 0
						}

					}
,
					"varname" : "live.numbox"
				}

			}
, 			{
				"box" : 				{
					"id" : "btn-gen",
					"maxclass" : "live.button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 10.0, 208.0, 30.0, 30.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 92.0, 22.0, 22.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Generate",
							"parameter_mmax" : 1,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Gen",
							"parameter_type" : 2
						}

					}
,
					"varname" : "live.button"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 11.0,
					"id" : "lbl-btn",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 46.0, 212.0, 175.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 36.0, 95.0, 175.0, 17.0 ],
					"text" : "▶ ベースライン生成"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "lbl-var",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 220.0, 208.0, 40.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 220.0, 92.0, 40.0, 12.0 ],
					"text" : "Var×"
				}

			}
, 			{
				"box" : 				{
					"id" : "num-var",
					"maxclass" : "live.numbox",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 258.0, 208.0, 40.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 258.0, 92.0, 40.0, 15.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_initial" : [ 1 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Variations",
							"parameter_mmax" : 8.0,
							"parameter_mmin" : 1.0,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Var",
							"parameter_type" : 1,
							"parameter_unitstyle" : 0
						}

					}
,
					"varname" : "live.numbox[2]"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "lbl-srcrow",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 245.0, 38.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 118.0, 38.0, 12.0 ],
					"text" : "上ネタ:",
					"textcolor" : [ 0.5, 0.8, 1.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "lbl-srctrk",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 245.0, 22.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 118.0, 22.0, 12.0 ],
					"text" : "Trk"
				}

			}
, 			{
				"box" : 				{
					"id" : "num-srctrk",
					"maxclass" : "live.numbox",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 50.0, 260.0, 32.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 50.0, 131.0, 32.0, 15.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "SrcTrack",
							"parameter_mmax" : 127.0,
							"parameter_mmin" : 0.0,
							"parameter_modmode" : 0,
							"parameter_shortname" : "SrcTrk",
							"parameter_type" : 1,
							"parameter_unitstyle" : 0
						}

					}
,
					"varname" : "live.numbox[3]"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "lbl-srcslt",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 88.0, 245.0, 22.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 88.0, 118.0, 22.0, 12.0 ],
					"text" : "Slt"
				}

			}
, 			{
				"box" : 				{
					"id" : "num-srcslt",
					"maxclass" : "live.numbox",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 88.0, 260.0, 32.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 88.0, 131.0, 32.0, 15.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "SrcSlot",
							"parameter_mmax" : 127.0,
							"parameter_mmin" : 0.0,
							"parameter_modmode" : 0,
							"parameter_shortname" : "SrcSlt",
							"parameter_type" : 1,
							"parameter_unitstyle" : 0
						}

					}
,
					"varname" : "live.numbox[4]"
				}

			}
, 			{
				"box" : 				{
					"id" : "btn-analyze",
					"maxclass" : "live.button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 126.0, 257.0, 20.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 126.0, 129.0, 20.0, 20.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_initial" : [ 0 ],
							"parameter_initial_enable" : 1,
							"parameter_longname" : "Analyze",
							"parameter_mmax" : 1,
							"parameter_modmode" : 0,
							"parameter_shortname" : "Anl",
							"parameter_type" : 2
						}

					}
,
					"varname" : "live.button[1]"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "lbl-analyze",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 150.0, 262.0, 120.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 150.0, 133.0, 120.0, 12.0 ],
					"text" : "← 上ネタMIDI解析",
					"textcolor" : [ 0.5, 0.8, 1.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "lbl-status",
					"maxclass" : "live.comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 290.0, 480.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 153.0, 470.0, 13.0 ],
					"text" : "Pythonアプリで音声解析 or 上ネタMIDI解析 → Root/Mode自動設定",
					"textjustification" : 0
				}

			}
, 			{
				"box" : 				{
					"id" : "lbl-bpm",
					"maxclass" : "live.comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 312.0, 480.0, 19.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 168.0, 480.0, 13.0 ],
					"text" : "BPMはAbletonのテンポを自動使用",
					"textjustification" : 0
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "lbl-osc",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 335.0, 480.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 183.0, 480.0, 12.0 ],
					"text" : "← Pythonアプリで解析すると自動反映 (OSC port 8001)",
					"textcolor" : [ 0.5, 0.8, 1.0, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-js",
					"maxclass" : "newobj",
					"numinlets" : 15,
					"numoutlets" : 6,
					"outlettype" : [ "", "", "", "", "", "" ],
					"patching_rect" : [ 10.0, 380.0, 240.0, 22.0 ],
					"saved_object_attributes" : 					{
						"filename" : "kemuri_generator.js",
						"parameter_enable" : 0
					}
,
					"text" : "js kemuri_generator.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-bars-expr",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 55.0, 340.0, 200.0, 22.0 ],
					"text" : "expr ($i1==0)?4:($i1==1)?8:16"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-udp-analysis",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 340.0, 160.0, 22.0 ],
					"text" : "udpreceive 8001"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-route-analysis",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 300.0, 368.0, 200.0, 22.0 ],
					"text" : "route /kemuri/analysis"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-unpack-analysis",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "float" ],
					"patching_rect" : [ 300.0, 396.0, 200.0, 22.0 ],
					"text" : "unpack s s f"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-call-analysis",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 424.0, 250.0, 22.0 ],
					"text" : "pak sym sym 120."
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 452.0, 250.0, 22.0 ],
					"text" : "prepend set_analysis"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-print",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 420.0, 200.0, 22.0 ],
					"text" : "print KemuriBeat"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-reader",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 450.0, 380.0, 160.0, 22.0 ],
					"saved_object_attributes" : 					{
						"filename" : "kemuri_reader.js",
						"parameter_enable" : 0
					}
,
					"text" : "js kemuri_reader.js"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-ana-livepath",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 450.0, 415.0, 120.0, 22.0 ],
					"text" : "live.path"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-ana-liveobj",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 450.0, 505.0, 75.0, 22.0 ],
					"text" : "live.object"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-ana-defer",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 580.0, 475.0, 65.0, 22.0 ],
					"text" : "deferlow"
				}

			}
, 		{
				"box" : 				{
					"id" : "msg-getnotes",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 580.0, 535.0, 220.0, 22.0 ],
					"text" : "call get_notes_extended 0 128 0 9999"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-ana-print",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 700.0, 565.0, 120.0, 22.0 ],
					"text" : "print KemuriBeat-note"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-ana-route",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 450.0, 565.0, 105.0, 22.0 ],
					"text" : "route note done"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-ana-zlnth",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 450.0, 597.0, 65.0, 22.0 ],
					"text" : "zl nth 1"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-ana-int",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 450.0, 627.0, 35.0, 22.0 ],
					"text" : "int"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-notein",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 3,
					"outlettype" : [ "int", "int", "int" ],
					"patching_rect" : [ 560.0, 380.0, 55.0, 22.0 ],
					"text" : "notein"
				}

			}
, 		{
				"box" : 				{
					"id" : "obj-noteout",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 560.0, 420.0, 60.0, 22.0 ],
					"text" : "noteout"
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 0 ],
					"source" : [ "btn-gen", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 2 ],
					"source" : [ "dial-comp", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 3 ],
					"source" : [ "dial-fill", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-bars-expr", 0 ],
					"source" : [ "menu-bars", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 6 ],
					"source" : [ "menu-mode", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 5 ],
					"source" : [ "menu-root", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 1 ],
					"source" : [ "menu-style", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 7 ],
					"source" : [ "num-slot", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 4 ],
					"source" : [ "obj-bars-expr", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-prepend", 0 ],
					"source" : [ "obj-call-analysis", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "lbl-bpm", 0 ],
					"source" : [ "obj-js", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "lbl-status", 0 ],
					"order" : 1,
					"source" : [ "obj-js", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "menu-mode", 0 ],
					"source" : [ "obj-js", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "menu-root", 0 ],
					"source" : [ "obj-js", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-print", 0 ],
					"order" : 0,
					"source" : [ "obj-js", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-js", 8 ],
					"source" : [ "obj-prepend", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-unpack-analysis", 0 ],
					"source" : [ "obj-route-analysis", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-route-analysis", 0 ],
					"source" : [ "obj-udp-analysis", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-call-analysis", 2 ],
					"source" : [ "obj-unpack-analysis", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-call-analysis", 1 ],
					"source" : [ "obj-unpack-analysis", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-call-analysis", 0 ],
					"source" : [ "obj-unpack-analysis", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-reader", 0 ],
					"source" : [ "obj-js", 4 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-js", 14 ],
					"source" : [ "obj-reader", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-ana-liveobj", 0 ],
					"source" : [ "obj-ana-livepath", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "msg-getnotes", 0 ],
					"source" : [ "obj-ana-defer", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-ana-print", 0 ],
					"source" : [ "obj-ana-liveobj", 0 ],
					"order" : 1
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-ana-liveobj", 0 ],
					"source" : [ "msg-getnotes", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-ana-route", 0 ],
					"source" : [ "obj-ana-liveobj", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-ana-zlnth", 0 ],
					"source" : [ "obj-ana-route", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-ana-int", 0 ],
					"source" : [ "obj-ana-zlnth", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-js", 13 ],
					"source" : [ "obj-ana-int", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-js", 14 ],
					"source" : [ "obj-ana-route", 1 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-js", 9 ],
					"source" : [ "num-var", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-js", 10 ],
					"source" : [ "num-srctrk", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-js", 11 ],
					"source" : [ "num-srcslt", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-js", 12 ],
					"source" : [ "btn-analyze", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-noteout", 0 ],
					"source" : [ "obj-notein", 0 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-noteout", 1 ],
					"source" : [ "obj-notein", 1 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-noteout", 2 ],
					"source" : [ "obj-notein", 2 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-ana-livepath", 0 ],
					"source" : [ "obj-js", 5 ]
				}

			}
, 		{
				"patchline" : 				{
					"destination" : [ "obj-ana-defer", 0 ],
					"source" : [ "obj-ana-livepath", 0 ]
				}

			}
 ],
		"parameters" : 		{
			"btn-gen" : [ "Generate", "Gen", 0 ],
			"btn-analyze" : [ "Analyze", "Anl", 0 ],
			"dial-comp" : [ "Complexity", "Comp", 0 ],
			"dial-fill" : [ "Fill", "Fill", 0 ],
			"menu-bars" : [ "Bars", "Bars", 0 ],
			"menu-mode" : [ "Mode", "Mode", 0 ],
			"menu-root" : [ "Root", "Root", 0 ],
			"menu-style" : [ "Style", "Style", 0 ],
			"num-slot" : [ "ClipSlot", "Slot", 0 ],
			"num-var" : [ "Variations", "Var", 0 ],
			"num-srctrk" : [ "SrcTrack", "SrcTrk", 0 ],
			"num-srcslt" : [ "SrcSlot", "SrcSlt", 0 ],
			"inherited_shortname" : 1
		}
,
		"dependency_cache" : [ 			{
				"name" : "kemuri_generator.js",
				"bootpath" : "D:/program files/ProgramData/kemuri-bass-generator/max_for_live",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
, 		{
				"name" : "kemuri_reader.js",
				"bootpath" : "D:/program files/ProgramData/kemuri-bass-generator/max_for_live",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
 ],
		"autosave" : 0,
		"oscreceiveudpport" : 0
	}

}
