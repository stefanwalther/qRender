// ------------------------------------------------------------------
// Copyright
// ------------------------------------------------------------------
// Stefan Walther - 11/15/2012
//
// This extension is published under the CreativeCommons license
// http://creativecommons.org/licenses/by-sa/3.0/
//
// References:
// jsRender: https://github.com/BorisMoore/jsrender
// Extension Icon: Maloq / http://de.wikipedia.org/wiki/Datei:Template_icon.svg

//
// Further information:
// http://www.qlikblog.at/1727/formatting-qlikview-data-the-web-way-qtemplate-object-extension
// ------------------------------------------------------------------


var gExtensionVersion = "1.0";
var gExtensionLoaded = false;
var gMaxRecordSize = 250;

// ------------------------------------------------------------------
// Core
// ------------------------------------------------------------------
Init();
function Init() {
    Qv.AddExtension("qTemplate",
        function () {

            var _this = this;

            this.Data.SetPagesizeY(gMaxRecordSize);

            _this.gExtensionLoaded = false;
            _this.pScrolling = true;
            _this.pCustomCSS = '';
            _this.pDirectTemplate = '';
            _this.pUseTemplateFile = false; // otherwise use direct template
            _this.pTemplateLocation = 'defaultTemplate.txt';
            _this.UniqueId = _this.Layout.ObjectId.replace("\\", "_");

            cLog('Trigger request for ' + _this.Layout.ObjectId);

            // Default style for qTemplate
            Qva.LoadCSS(Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=' + "Extensions/qTemplate/lib/css/qTemplate.css");

            var jsFiles = [];
            jsFiles.push('Extensions/qTemplate/lib/js/jsrender.js');
            Qv.LoadExtensionScripts(jsFiles, function () {
                Load();
            });

            


            //            if (!_this.gExtensionLoaded) {
            //                var jsFiles = [];
            //                jsFiles.push('Extensions/qTemplate/lib/js/jsrender.js');
            //                Qv.LoadExtensionScripts(jsFiles, function () {
            //                    gExtensionLoaded = true;
            //                    Load();
            //                });
            //            }
            //            else {
            //                Load();
            //            }


            // ------------------------------------------------------
            function Load() {
                $(_this.Element).empty();
                initObjectIds();
                initProps();
                initCustomCSS();
                initFrame();
                renderTemplate();
                renderEvents();
            }


            // ------------------------------------------------------------------
            // Properties
            // ------------------------------------------------------------------
            function initObjectIds() {
                //if (!_this.gExtensionLoaded) {
                _this.pId_ResultFrame = "divResultFrame_" + _this.UniqueId;
                //alert('Unique in initOjectIds: ' + _this.UniqueId);
                //}
            }

            function initProps() {
                _this.pUseTemplateFile = (getQVIntProp(0) == 0);
                _this.pTemplateLocation = getQVStringProp(1);
                _this.pDirectTemplate = getQVStringProp(2);
                _this.pCustomCSS = getQVStringProp(3);
                _this.pScrolling = getQVBoolProp(4);
            }

            function initCustomCSS() {
                if (_this.pCustomCSS != '') {
                    var cssUrl = '';
                    if (isURL(_this.pCustomCSS)) {
                        cssUrl = _this.pCustomCSS;
                    }
                    else {
                        cssUrl = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=' + 'Extensions/qTemplate/templatestyle/' + _this.pCustomCSS + '&UniqueRequest=' + _this.UniqueId + '&ts=' + getTimeStamp();
                    }
                    Qva.LoadCSS(cssUrl);
                }
            }

            // ------------------------------------------------------------------
            // Html frame
            // ------------------------------------------------------------------
            function initFrame() {

                var divResult = document.createElement("div");
                divResult.id = _this.pId_ResultFrame;
                //divResult.className = 'divResultFrame';
                if (_this.pScrolling) {
                    divResult.style.overflow = "auto";
                }
                divResult.style.width = _this.GetWidth() + 'px';
                divResult.style.height = _this.GetHeight() + 'px';
                _this.Element.appendChild(divResult);

            }

            // ------------------------------------------------------------------
            // Rendering
            // ------------------------------------------------------------------

            function renderToDom(templateString) {

                $('#' + _this.pId_ResultFrame).html(templateString);

                var $renderTemplate = $('#' + _this.pId_ResultFrame).find('#renderTemplate');
                var $baseTemplateObject = $('#' + _this.pId_ResultFrame).find('#baseTemplateObject');

                if ($baseTemplateObject.clone().wrap('<p>').parent().html() == null) {
                    $baseTemplateObject = $("<div id='baseTemplateObject'></div>");
                }

                $baseTemplateObject.append($renderTemplate.render(_this.Data.Rows));
                $('#' + _this.pId_ResultFrame).html($baseTemplateObject);

            }

            function renderTemplate() {

                cLog('Render ' + _this.UniqueId);

                if (_this.pUseTemplateFile) {
                    cLog('Render using a template file: ' + _this.pTemplateLocation);

                    var templateFile = _this.pTemplateLocation;

                    // Check wheater we deal with an Url, otherwise point to the templates subdirectory
                    var templateUrl = '';
                    if (isURL(_this.pTemplateLocation)) {
                        templateUrl = _this.pTemplateLocation;
                    }
                    else {
                        templateUrl = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=' + 'Extensions/qTemplate/templates/' + templateFile + '&UniqueRequest=' + _this.ObjectId + '&ts=' + getTimeStamp();
                    }

                    // Disable caching of AJAX responses 
                    $.ajaxSetup({
                        cache: false,
                        // force html instead of xml, this prevents some possible errors how different browser handle xml docs
                        dataType: 'html'
                    });
                    $.get(templateUrl, function (data) {

                        if (data == null || data == 'undefined') {
                            alert('An error occured fetching the data for qTemplate (' + _this.Layout.ObjectId + '): No data defined');
                        }
                        else {

                            var templateRaw = "";
                            try {
                                templateRaw = xml_to_string(data);
                            } catch (e) {
                                alert("An error occured rendering extension qTemplate for object \"" + _this.Layout.ObjectId + "\", please review your template, this has to be XHTML compliant.\n\nOriginal error message:\n\n" + e.message);
                                return;
                            }



                            try {

                                renderToDom(templateRaw);

                            } catch (e) {
                                alert("An error occured while rendering qTemplate for object \"" + _this.Layout.ObjectId + "\"\n\nOriginal error message: \n\n" + e.message);
                            }

                        }
                    });
                }
                else {
                    // Direct template
                    var templateRaw = xml_to_string(_this.pDirectTemplate);

                    if (!isBlank(templateRaw)) {
                        renderToDom(templateRaw);
                    }
                }
            }

            function renderEvents() {
                // Placeholder for a future release to select rows ...
            }

            // ------------------------------------------------------------------
            // Extension helper functions
            // ------------------------------------------------------------------
            function getQVBoolProp(idx) {

                var x = eval('_this.Layout.Text' + idx + '.text');
                return (x == 1);
            }

            function getQVStringProp(idx) {

                var p = '';
                if (eval('_this.Layout.Text' + idx)) {
                    p = eval('_this.Layout.Text' + idx + '.text');
                }
                return p;
            }

            function getQVIntProp(idx) {
                var p = -1;
                try {
                    if (eval('_this.Layout.Text' + idx)) {
                        p = parseInt(eval('_this.Layout.Text' + idx + '.text'));
                    }
                } catch (e) {
                    // don't throw this error, just return -1, the default value
                    // alert('NaN');
                }
                return p;
            }

        }, false);
}

function qvSelectRow() {
    alert(this);
}

    // ------------------------------------------------------------------
    // General helper functions
    // ------------------------------------------------------------------
    function alertProps(o) {
        var sMsg = "";
        for (var key in o) {
            if (o.hasOwnProperty(key)) {
                sMsg += key + " -> " + o[key] + "\n";
            }
        }
        alert(sMsg);
    }

    // https://github.com/clientside/amplesdk/commit/f29445c8786fab517221c8816c1869c3c522cf0b
    // See why converting to string is necessary for IE9
    // http://bugs.jquery.com/ticket/8972#comment:13
    function xml_to_string(xml_node) {
        return xml_node;

        // Not really necessary anymore, but leave it here, maybe we need it in the future ... ;-)
        /*
        if (xml_node.xml) {
            cLog('xml_node.xml');
            return xml_node.xml; ;
        }
        else if (window.DOMParser) {
            cLog('window.DOMParser');
            return new DOMParser().parseFromString(xml_node, 'text/xml');
        }
        else if (XMLSerializer) {
            cLog('XMLSerializer');
            var oXmlSerializer = new XMLSerializer();
            return oXmlSerializer.serializeToString(xml_node);
        } else {
            cLog('ERROR: Extremely old browser');
            alert("ERROR: Extremely old browser");
            return "";
        }
        */
    }

    function isURL(s) {
        var regexp = /http:\/\/[A-Za-z0-9\.-]{3,}\.[A-Za-z]{3}/;
        return regexp.test(s);
    }

    function getTimeStamp() {

        return new Date().getTime();
    }

    function cLog(msg) {
        try {
            console.log(msg);
        } catch (e) {
            // do nothing
        }
    }

    function isBlank(pString) {
        if (!pString || pString.length == 0) {
            return true;
        }
        // checks for a non-white space character  
        // which I think [citation needed] is faster  
        // than removing all the whitespace and checking  
        // against an empty string 
        return !/[^\s]+/.test(pString);
    } 




