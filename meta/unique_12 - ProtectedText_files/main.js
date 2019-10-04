/*

  --- Thank you for looking into the code! --- 

  For your convenience, all custom JavaScript used on sub-sites is in this file.

  --- General description: ---

  This file consists of following:
  
  - ClientState class

    - This class stores state of the client, and is used to perform actions triggered by clicking on 'Reload', 'Save', 'Change password' and 'Delete' button.

    - This class is responsible for handling all communication with the server (methods saveSite(), deleteSite(), reloadSite()),
      which are perform using AJAX calls through jQuery API.

    - Outside of this class there is just one global variable called 'state', which is instance of this class,
      constructed in function defined at the end of sub-site HTML (creation of this object is only custom JavaScript code outside of this file).

    - All variables in class ClientState are defined at the beginning of the class.
      'siteURLArg', 'eOrigContentArg', 'isNewArg', 'currentDBVersionArg' and 'expectedDBVersionArg'
       and are provided from server, while others exist only in client.


  - $(function) - first function called once page is loaded. 
    - invokes creating of 'state' object
    - initializes the GUI
    - initializes the state of the site by calling initState()

  - initState - initializes decryption of the site

  - finishInitialization - sets 'initHashContent', updates button enablement, focuses text area, and sets content of textarea

  - decryptContentAndFinishInitialization - decrypts content using old password (Reload button), or asks for new password (site initialization)

  - GUI related functions:
    - updateButtonEnablement - sets correct enablement of buttons based on client state
    - addTab - function for adding new tab, invoked by clicking on '+' button
    - initTabsLayout - GUI initialization of tabs
    - handleScrolling - part of GUI initialization that deals with scrolling
    - focusActiveTextarea - detects currently selected tab and focuses it's textarea
    - setContentOfTabs and getContentFromTabs - functions responsible for setting content of tabs and reading content from tabs
    - getTitleFromContent - computes tab title from content of corresponding textarea
    - toast - function responsible for showing short messages to the user 

*/

/*
  Following free software license (MIT License) applies to this JS code: 

    Copyright (C) 2013-2019 ProtectedText.com

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
      associated documentation files (the "Software"), to deal in the Software without restriction, 
      including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
      and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
      subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT 
      NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
      WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


*/

// class that stores client state
function ClientState(siteURLArg, eOrigContentArg, isNewArg, currentDBVersionArg, expectedDBVersionArg) { // constructor function
    
    // provided from server:
    var site = siteURLArg; // URL of the site
    var eOrigContent = eOrigContentArg; // encrypted content received from server
    var isNew = isNewArg; // is the site new
    var currentDBVersion = currentDBVersionArg;     // Database versions are provided to client because: in case hashContent computation is changed,
    var expectedDBVersion = expectedDBVersionArg;   // only client can decrypt the content and compute new hashContent that will be saved on server.
    
    // computed:
    var siteHash = CryptoJS.SHA512(site).toString(); // hash of site URL, added to content before it's encrypted,
                                                     // so that password correctness can be tested when decrypting the content
    var isTextModified = false; // 'Save' button is enabled if text was modified
    var initHashContent; // Initial hash of decrypted content, used for testing user's right to save changes and for overwrite protection.
                         // Server allows the user to save and delete the current site only if he knows this hashContent value,
                         // which is computed using dectypted content, so only the user who was able to decrypt the content has the right to change it.
                         // When new content is save, new hashContent is provided to server, which will be used to verify the user next time.
    var content = ""; // text shown in textarea
    var password = ""; // users password. It never leaves the client, and isn't part of any hash or encrypted data sent to server.
    var initialIsNew = isNew; // was site new or did user have to decrypt it first
    var mobileAppMetadataTabContent = ""; // content of tab with mobile app metadata (such as note color, etc.)

  // --- methods: ---
  
    this.updateIsTextModified = function(isModified) {
        if (isTextModified === isModified)
            return;
        isTextModified = isModified;
        updateButtonEnablement(isTextModified, isNew);
    };

    // computes hash of initial decrypted content
    this.setInitHashContent = function() {
        initHashContent = this.computeHashContentForDBVersion(content, password, currentDBVersion);
    };

    // compute the hash of the content for provided version of Database (newer versions can upgrade the way hash of the content is computed)
    this.computeHashContentForDBVersion = function(contentForHash, passwordForHash, dbVersion) {
        if (dbVersion == 1)
            return CryptoJS.SHA512(contentForHash).toString();
        else if (dbVersion == 2)
            return CryptoJS.SHA512(contentForHash + CryptoJS.SHA512(passwordForHash).toString()).toString() + dbVersion;
        else {
            // loaded site in the browser hasn't refreshed for a long time, so long that the new dbVersion code wasn't ever loaded.
            // we have to force the refresh in order to prevent recursive calls from saveSite function. 
            $(window).off('beforeunload');
            location.reload(true);
        }
    };

    // sets login password and content, and return true if password is correct
    this.setLoginPasswordAndContentIfCorrect = function(pass) {
        var newContent;
        try {
            newContent = CryptoJS.AES.decrypt(eOrigContent, pass).toString(CryptoJS.enc.Utf8); // try decrypting content
        }
        catch (err) {
            return false;
        }
        
        if (newContent.indexOf(siteHash, newContent.length - siteHash.length) !== -1) { // if newContent.endsWith(siteHash)
            content = newContent.substr(0, newContent.length - siteHash.length); 
            password = pass;
            return true;
        } 
        return false;
    };
    
  // --- user actions triggered by pressing some button: --- 
  
    this.saveSite = function(newPass) {
        
        var executeSaveSite = function(passwordToUse) { 
            content = getContentFromTabs(); // grab new content from tabs 
            var newHashContent = state.computeHashContentForDBVersion(content, passwordToUse, expectedDBVersion);
            var eContent = CryptoJS.AES.encrypt(String(content + siteHash), passwordToUse).toString(); // encrypt(content + siteHash, password)

            $.ajax({ // AJAX call to save encrypted text on server
                url : site,
                type : "POST",
                data : { // data that's sent to server:
                    "initHashContent" : initHashContent, // hash of initial decrypted content (to prove that you are allowed to write to this site, because you ware able to decrypt it)
                    "currentHashContent" : newHashContent, // new hash
                    "encryptedContent" : eContent, // encrypted content stored on server.
                    "action" : "save" // 'save' action is being performed
                },
                dataType : "json",
                beforeSend : function() {
                    $("#loader").show(); // overlay
                },
                success: function(responseObject, textStatus, jqXHR) {
                    $("#loader").hide();
                    if (responseObject.status == "success") {
                        toast("Saved!", 1500);
                        // update the state:
                        isNew = false;
                        isTextModified = false;
                        password = passwordToUse;
                        currentDBVersion = expectedDBVersion;
                        finishInitialization(true);
                    }
                    else if (responseObject.status != "success" && responseObject.message !== undefined) { // special messages from server
                        toast("Failed! " + responseObject.message, 2500);
                        focusActiveTextarea();
                    }
                    else if (responseObject.status != "success" && responseObject.expectedDBVersion !== undefined) { // special messages from server
                        if (expectedDBVersion < responseObject.expectedDBVersion) {
                            expectedDBVersion = responseObject.expectedDBVersion;
                            executeSaveSite(passwordToUse); // retry with newer version
                        }
                        focusActiveTextarea();
                    }
                    else {
                        $("#dialog-site-modified").dialog({ // text was changed in the meantime, show dialog
                            dialogClass : "no-close active-dialog",
                            modal : true,
                            minWidth: 345,
                            buttons : {
                                "Ok, I've got it." : function() {
                                    $(this).dialog("close");
                                }
                            },
                            close: function( event, ui ) {
                                focusActiveTextarea();
                            }
                        });
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $("#loader").hide();
                    toast("Save failed! <br/> <span style='font-size: 0.9em; font-weight: normal'>(check your connection)</span>", 2500);
                    focusActiveTextarea();
                },
                timeout: 30000 // wait 30sec max
            });
        };
        
        if (newPass == true) { // ask for new password (when saving for the first time, or when changing the password)
            var classes = "no-close show-additional-text active-dialog";
            var titleString = "Change password";
            if (isNew) { // when creating the password don't show suggestion to enter 'new' password, and use appropriate title
                classes = "no-close active-dialog";
                titleString = "Create password";
            }
            $("#dialog-new-password").dialog({ // show dialog
                resizable : false,
                dialogClass: classes,
                title: titleString,
                modal : true,
                buttons : {
                    "Save" : function() {
                        var pass1 = $("#newpassword1").val();
                        var pass2 = $("#newpassword2").val();
                        if (pass1.length == 0) {
                            $("#passwords-empty").show().effect( "shake", {distance: 5, times: 2} );
                            $("#passwords-dont-match").hide();
                            return;
                        }
                        if (pass1 != pass2) {
                            $("#passwords-dont-match").show().effect( "shake", {distance: 5, times: 2} );
                            $("#passwords-empty").hide();
                            return;
                        }
                        
                        $(this).dialog("close");
                        executeSaveSite(pass1);
                    },
                    "Cancel" : function() {
                        $(this).dialog("close");
                    }
                },
                open: function( event, ui ) { // clear old passwords
                    $("#newpassword1").val("");
                    $("#newpassword2").val("");
                    $("#passwords-dont-match").hide();
                    $("#passwords-empty").hide();
                },
                close: function( event, ui ) {
                    focusActiveTextarea();
                }
            });
        }
        else { // use old password
            executeSaveSite(password);
        }
    };
    
    this.deleteSite = function() {
        var executeDeleteSite = function() {
            $.ajax({ // AJAX call to delete the site
                url : site,
                type : "POST",
                data : { // data that's sent to server:
                    "initHashContent" : initHashContent, // hash of initial decrypted content (to prove that you are allowed to write to this site, because you ware able to decrypt it)
                    "action" : "delete" // 'delete' action is being performed
                },
                dataType : "json",
                beforeSend : function() {
                    $("#loader").show(); // overlay
                },
                success: function(responseObject, textStatus, jqXHR) {
                    $("#loader").hide();
                    if (responseObject.status == "success") {
                        toast("Site was deleted!", 2500);
                        window.setTimeout(function() { // redirect after toast is gone.
                            window.location = site;
                        }, 3200);
                    }
                    else {
                         toast("Failed! Site was modified in the meantime. Reload first.", 5000);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $("#loader").hide();
                    toast("Deleting failed! <br/> <span style='font-size: 0.9em; font-weight: normal'>(check your connection)</span>", 2500);
                    focusActiveTextarea();
                },
                timeout: 30000 // wait 30sec max
            });
        };
        
        $("#dialog-confirm-delete-site").dialog({ // show dialog
            dialogClass : "no-close active-dialog",
            modal : true,
            buttons : {
                "Delete site!" : function() {
                    $(this).dialog("close");
                    executeDeleteSite();
                },
                "Cancel" : function() {
                    $(this).dialog("close");
                }
            },
            close: function( event, ui ) {
                focusActiveTextarea();
            }
        });
    };
    
    this.reloadSite = function() {
        var executeReloadSite = function() { // function that reloads the site
            $.ajax({ // AJAX call to reload the site
                url : site,
                type : "GET",
                data : { // data that's sent to server:
                    "action" : "getJSON" // just get data in JSON format, not whole HTML site.
                },
                dataType : "json",
                beforeSend : function() {
                    $("#loader").show(); // overlay
                },
                success: function(responseObject, textStatus, jqXHR) {
                    $("#loader").hide();
                    toast("Reloaded!", 500);
                    isTextModified = false;
                    eOrigContent = responseObject.eContent;
                    currentDBVersion = responseObject.currentDBVersion;
                    expectedDBVersion = responseObject.expectedDBVersion;
                    var wasNew = isNew;
                    isNew = responseObject.isNew;
                    if (isNew == true) { 
                        content = "";
                        finishInitialization();
                        if (wasNew == false) // was deleted in meantime
                            window.setTimeout(function() {
                                toast("Site was deleted!", 2000);
                            }, 500+750);
                    }
                    else
                        decryptContentAndFinishInitialization(true); // try using old password
                    
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $("#loader").hide();
                    toast("Reloading failed! <br/> <span style='font-size: 0.9em; font-weight: normal'>(check your connection)</span>", 2500);
                    focusActiveTextarea();
                },
                timeout: 30000 // wait 30sec max
            });
        };
        if (isTextModified == true) { // show 'are you sure' dialog if text wasn't saved
            $("#dialog-confirm-reload").dialog({
                dialogClass : "no-close active-dialog",
                modal : true,
                buttons : {
                    "Reload" : function() {
                        $(this).dialog("close");
                        executeReloadSite();
                    },
                    "Cancel" : function() {
                        $(this).dialog("close");
                    }
                },
                close: function( event, ui ) {
                    focusActiveTextarea();
                }
            });
        }
        else {
            executeReloadSite();
        } 
    };

    
  // --- getters: ---
  
    this.getSite = function() { return site; };
    this.getIsNew = function() { return isNew; };
    this.getInitialIsNew = function() { return initialIsNew; };
    this.getIsTextModified = function() { return isTextModified; };
    this.getContent = function() { return content; };
    this.getPassword = function() { return password; };
    this.getMobileAppMetadataTabContent = function() { return mobileAppMetadataTabContent; };
    this.setMobileAppMetadataTabContent = function(metadata) { mobileAppMetadataTabContent = metadata; };
    
}; // end of ClientState class definition



// init function - called once page is loaded
$(function() {
    
  // Create global 'state' object
    createState();
    
  // GUI init:
    // hide 'loading...'
    $("#loadingdiv").remove();

    // following html insert is required to override browser-cached values in case the browser decides to prepopulate input fields with old values.
    $("#tabs").html('<ul><li><a href="#tabs-0">Empty Tab</a><span class="ui-icon ui-icon-close" role="presentation">Remove Tab</span></li><button id="add_tab">+</button></ul>\
                     <div id="tabs-0"><textarea rows="1" cols="1" class="textarea-contents" placeholder="your text goes here..." ></textarea></div>');
    
    // display site
    $("#wholesite").removeClass("displaynone");
    
    
    // create buttons
    $("#menubar-buttons button").button({ disabled: true });
            
    // listening for changes in any textarea
    $("#tabs").on("input", "textarea.textarea-contents", function(e) {
        if (ignoreInputEvent == true) {
            e.preventDefault();
            return; // skip this event
        }
        state.updateIsTextModified(true);
        
        // update tab title when change in textarea is detected (within first 200 chars)
        if ($(this).get(0).selectionStart <= 201)
            currentTabTitle.text(getTitleFromContent());
    });
    $("#tabs").on("paste", "textarea.textarea-contents", function() {
        // update tab title when paste action is detected
        setTimeout("currentTabTitle.text(getTitleFromContent())", 50);
    });

    // ensure tab key behaves as expected 
    $("#tabs").on("keydown", "textarea.textarea-contents", function(e) {
        var keyCode = e.keyCode || e.which;
        // tab key inserts 4 spaces, if pressed alone
        if (keyCode == 9 && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
            e.preventDefault();
            var start = $(this).get(0).selectionStart;
            var end = $(this).get(0).selectionEnd;
            // set textarea value to: text before caret + tab + text after caret
            $(this).val($(this).val().substring(0, start) + "    " + $(this).val().substring(end));
            // put caret at right position again
            $(this).get(0).selectionStart = $(this).get(0).selectionEnd = start + 4;
            state.updateIsTextModified(true);
        }
        // Ctrl + S saves the site
        if (e.ctrlKey && keyCode == 83 && !e.altKey && !e.shiftKey && !e.metaKey) {
            $("#button-save").focus(); // prevent text input while site is been saved
            $("#button-save").trigger("click");
            e.preventDefault();
        }
    });
    
    // when entering password, enter triggers clicking on the button
    $("#enterpassword").keypress(function (e) {
        if (e.which == 13) {
            $("#dialog-password").next().find("button:first").click(); // button location in jQuery dialog
            e.preventDefault();
        }
    });
    $("#newpassword2").keypress(function (e) {
        if (e.which == 13) {
            $("#dialog-new-password").next().find("button:first").click(); // button location in jQuery dialog
            e.preventDefault();
        }
    });

    // listen for clicks on buttons
    $("#button-save").click(function() { state.saveSite(state.getIsNew()); }); // show 'enter password' dialog if site isNew, otherwise don't
    $("#button-savenew").click(function() { state.saveSite(true); }); // Change Password buttons saves the site using new password
    $("#button-reload").click(function() { state.reloadSite(); });
    $("#button-delete").click(function() { state.deleteSite(); });

    // construct tabs
    initTabsLayout();
    // handle positioning of textarea
    handleScrolling();

  // init site:
    initSite();
});

function initSite() { // called at the end of site initialization
    if (state.getIsNew()) {
        $("#dialog-new-site").dialog({ // show dialog
            resizable : false,
            closeOnEscape: false,
            dialogClass: "no-close active-dialog",
            modal : true,
            buttons : {
                "Create site" : function() {
                    $(this).dialog("close");
                    // content is initially ""
                    finishInitialization();
                },
                "Cancel" : function() {
                    window.location = "/";
                }
            }
        });
    }
    else { // password needed
    	
    	// check if URL contains the password after '?', such as /sitename?sitepassword - which is used for 'public' site links that have 'embedded' password
    	// note that this can't work if password contains spaces (' ')
    	var queryString = window.location.search.substring(1);
    	if (! (queryString == null || queryString.length == 0) ) { // if password is provided, try using it
	        var success = state.setLoginPasswordAndContentIfCorrect(queryString);
	        if (success == true) {
	            finishInitialization();
	            $("#button-delete").remove(); // 'public' site probably shouldn't be deleted
            	$("#button-savenew").remove(); // 'public' site with embeded password probably shouldn't change that password
	            return;
	        }
    	}
    	
    	// show password dialog
        decryptContentAndFinishInitialization(false); // decrypt content, request new password
    }
}

var ignoreInputEvent = true; // used to determinate when .js code is setting content of textarea, so that invocation of 'input' event from IE can be skipped.
// set initHashContent, update button enablement, focus text area, and set content
function finishInitialization(shouldSkipSettingContent) {
    state.setInitHashContent();
    // init button enablement
    updateButtonEnablement(state.getIsTextModified(), state.getIsNew());
    focusActiveTextarea();
    ignoreInputEvent = true; // ignore 'input' events triggered when setting content
    if (shouldSkipSettingContent != true) // on save don't redisplay content - needed to stay on the same tab and in same position
        setContentOfTabs(state.getContent());
    setTimeout(function() { ignoreInputEvent = false; } , 50); // stop ignoring input events later
    fixUpOfflineSite(); // used when site is an offline backup, and needs to be fixed-up to work properly 
}

// function responsible for decrypting content (and asking user to enter password when needed)
function decryptContentAndFinishInitialization(isOld) {
    var tryNewPassword = function() { // function for retrying passwords
        $("#dialog-password").dialog({ // show dialog
            resizable : false,
            closeOnEscape: false,
            dialogClass: "no-close show-additional-text active-dialog",
            modal : true,
            buttons : {
                "Decrypt this site" : function() {
                    $(this).dialog("close");
                    var pass = $("#enterpassword").val();
                    var success = state.setLoginPasswordAndContentIfCorrect(pass);
                    if (success == false) {
                        toast("Wrong password", 700, 200, 100);
                        tryNewPassword();
                    }
                    else 
                        finishInitialization();
                }
            },
            open: function( event, ui ) {
                $("#enterpassword").val("").focus(); // clear old password and focus input field
            }
        });
    };
    var success = false; // is password correct
    if (isOld == true) { // use old password
        success = state.setLoginPasswordAndContentIfCorrect(state.getPassword());
        if (success == false)
            tryNewPassword();
        else
            finishInitialization();
    }
    else {
        $("#dialog-password").dialog({ // show dialog
            resizable : false,
            closeOnEscape: false,
            dialogClass: "no-close active-dialog",
            modal : true,
            buttons : {
                "Decrypt this site" : function() {
                    $(this).dialog("close");
                    var pass = $("#enterpassword").val();
                    var success = state.setLoginPasswordAndContentIfCorrect(pass);
                    if (success == false) {
                        toast("Wrong password", 700, 200, 100);
                        tryNewPassword();
                    }
                    else
                        finishInitialization();
                }
            },
            open: function( event, ui ) {
                $("#enterpassword").val("").focus(); // clear old password and focus input field
            }
        });
    }
}


// updates enablement of buttons
function updateButtonEnablement(isTextModified, isSiteNew) {
    if (isTextModified == true) {
        $("#button-save").button("enable");
        if (state.getInitialIsNew() == false) { // for old sites, when needed, warn user that he'll lose changes unless he saves first
            $(window).on('beforeunload', function() { 
                return "If you don't 'Save', you'll lose your changes.";
            });
        }
    }
    else {
        $("#button-save").button("disable");
        $(window).off('beforeunload');
    }

    if (isSiteNew == true)
        $("#button-savenew").button("disable");
    else
        $("#button-savenew").button("enable");

    $("#button-reload").button("enable");

    if (isSiteNew == true)
        $("#button-delete").button("disable");
    else
        $("#button-delete").button("enable");
}


var addTab; // adds new tab, function is assigned later
// part of GUI initialization
function initTabsLayout() {
    var tabs = $( "#tabs" ).tabs();
    refreshTabs();
    tabs.find( ".ui-tabs-nav" ).sortable({
        axis : "x",
        stop : function() {
            refreshTabs();
        },
        change : function(event, ui) { // invoked when tabs are changed
            state.updateIsTextModified(true);
        }
    });
    
    tabs.on("tabsactivate", function(event, ui) {
        setTimeout(focusActiveTextarea, 1); // hacky way to get focus on textarea
    });
    
    var tabTemplate = "<li><a href='#{href}'>Empty Tab</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
    var tabCounter = 1;
   
    addTab = function(isExistingTab, contentIfAvailable) {
        var id = "tabs-" + tabCounter;
        var li = $(tabTemplate.replace( /\{href\}/g, id ));
        tabs.find(".ui-tabs-nav").append(li);
        tabs.append("<div id='" + id + "'><textarea rows='1' cols='1' class='textarea-contents' placeholder='your text goes here...' ></textarea></div>");
        if (contentIfAvailable != undefined && contentIfAvailable.length > 0) {
            $("#" + id + " textarea.textarea-contents").val(contentIfAvailable);
            li.find("a").text(getTitleFromContent(contentIfAvailable.substr(0, 200)));
        }
        refreshTabs();
        onWindowResize();
        tabCounter++;
        focusActiveTextarea();
        if (! isExistingTab) { // new tab was added
            state.updateIsTextModified(true);
            $("#tabs").tabs({ active : $("#tabs >ul >li").size() - 1 }); // focus new tab
        }
    };
    
    $( "#add_tab" ).button().click(function() {
        addTab(false);
    });
    
    // closing tab, activated when clicking on 'x' in non-first tab
    tabs.delegate("span.ui-icon-close", "click", function() {
        var currentTab = $(this).closest("li");
        $("#dialog-confirm-delete-tab").dialog({ // show dialog
            dialogClass : "no-close active-dialog",
            modal : true,
            buttons : {
                "Delete tab" : function() {
                    $(this).dialog("close");
                    var panelId = currentTab.remove().attr("aria-controls");
                    $("#" + panelId).remove();
                    state.updateIsTextModified(true);
                    refreshTabs();
                },
                "Cancel" : function() {
                    $(this).dialog("close");
                }
            },
            close : function( event, ui ) {
                focusActiveTextarea();
            }
        });
    });

    function refreshTabs() {
        tabs.tabs("refresh");
        // display close icons on tabs if there is more than one of them
        if ($("#tabs >ul >li").size() > 1)
            tabs.find(".ui-tabs-nav li span").show();
        else
            tabs.find(".ui-tabs-nav li span").hide();
        focusActiveTextarea();
    }
}

var onWindowResize; // function is assigned later
function handleScrolling() {
    $("body").css("overflow", "hidden");
    $("#main-content-outter").css("overflow", "hidden");
    onWindowResize = function() {
        var computedHeight = $(window).height() - $("#menubar").outerHeight();
        $("#main-content-outter").css("height", computedHeight);
        computedHeight = $("#main-content-outter").height() - $("#tabs ul.ui-tabs-nav").outerHeight();
        $("#tabs div").css("height", computedHeight);
        // center active dialog by changing dialog options on element from which dialog was created
        try {
        	$(".active-dialog >div.ui-dialog-content").dialog("option", "position", "center");
        } catch(err) {
        	isOfflineSite = true; // this error is throw for offline sites (dirty detection)
        }
    };
    $(window).resize(onWindowResize);
    onWindowResize();
}

var isOfflineSite; // true for offline sites (var is set in handleScrolling())
// function that fixes problems with sites that were saved locally as offline backup 
function fixUpOfflineSite() {
	if (isOfflineSite) {
		$(".ui-dialog").remove(); // remove dialogs
		$(".ui-widget-overlay").remove(); // remove overlay 
		$("#menubar-buttons").remove(); // remove buttons since they won't work offline
		toast("This is READ-ONLY encrypted offline copy.", 5000);
	}
}


var currentTabTitle; // holds jQuery object of title belonging to currently selected tab
var currentTextarea; // holds jQuery object of texarea belonging to currently selected tab
function focusActiveTextarea() {
    // focus textarea that belongs to currently open tab
    currentTabTitle = $("#tabs ul li[aria-selected='true'] a");
    currentTextarea = $("#tabs .ui-tabs-panel[aria-expanded='true'] textarea.textarea-contents");
    currentTextarea.focus();
}

// functions for setting content of tabs using data from server
function setContentOfTabs(content) {
    // tabs are separated by fixed hex value that's 128 chars long
    var separator = CryptoJS.SHA512("-- tab separator --").toString();
    var tab = content.split(separator);
    // remove old tabs (needed if this is triggered from reload action)
    $("#tabs >ul >li").remove();
    $("#tabs >div").remove();
    // add tabs with content
    for (var i = 0; i < tab.length; i++) {
        // tabs starting with specific string below are metadata produced by mobile app (color of note, etc.), and shouldn't be visibe in web browser
        if (tab[i].indexOf("\u267B Reload this website to hide mobile app metadata! \u267B") === 0)  // .startsWith() isn't supported in IE :(
            state.setMobileAppMetadataTabContent(tab[i]);
        else
            addTab(true, tab[i]);
    }
    $("#tabs").tabs({ active : 0 }); // make first tab active
}

// functions for reading content from tabs
function getContentFromTabs() { 
    var separator = CryptoJS.SHA512("-- tab separator --").toString();
    var allTabsContent = "";
    $("#tabs >ul >li").each(function(i) {
        var currentId = $(this).attr("aria-controls");
        if (i > 0) allTabsContent += separator;
        allTabsContent += $("#" + currentId + " textarea.textarea-contents").val();
    });
    var mobileMetadata = state.getMobileAppMetadataTabContent();
    if (typeof mobileMetadata === 'string' && mobileMetadata.length > 0) { // add metadata tab at the end
        allTabsContent += separator;
        allTabsContent += mobileMetadata;
    }
    return allTabsContent;
}

// function for computing name of tab from content of textarea
// name is computed from first line that doesn't consist only of whitespace chars,
//   maximum size is 20,
//   and only first 200 chars are looked at in this process
function getTitleFromContent(content) {
    if (content === undefined)
        content = currentTextarea.val().substr(0, 200);
    var i, pos, title;
    for (i = 0; i < content.length; i++) {
        if (content[i] != ' ' && content[i] != '\n' && content[i] != '\t' && content[i] != '\r' && content[i] != '\v' && content[i] != '\f') {
            // found first non-whitespace char
            pos = content.indexOf('\n', i + 1); // next new line char
            if (pos == -1) pos = 200;
            title = content.substr(i, pos - i);
            break;
        }
    }
    if (title === undefined || title.length == 0)
        return "Empty Tab";
    if (title.length > 20)
        title = title.substr(0, 18) + "...";
    return title;
}

// for displaying short messages
function toast(text, duration) {
    $("#toast").html(text);
    $("#outer-toast").fadeIn(400).delay(duration).fadeOut(300); 
}
function toast(text, duration, fadeInDuration, fadeOutDuration) {
    $("#toast").html(text);
    $("#outer-toast").fadeIn(fadeInDuration).delay(duration).fadeOut(fadeOutDuration); 
}

