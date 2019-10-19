package protectedtext

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
)

const (
	getnoteurl = "https://www.protectedtext.com/%s?action=getJSON"
	noteurl    = "https://www.protectedtext.com/%s"
)

var (
	ERROR_UPDATE  = errors.New("returned status equal to failed")
	ERROR_UNKNOWN = errors.New("some unknown error")
)

type note_req struct {
	InitHashContent    string `json:"initHashContent"`
	CurrentHashContent string `json:"currentHashContent"`
	EncryptedContent   string `json:"encryptedContent"`
	Action             string `json:"action"`
	//Firstrun           bool   `json:"_"`
}

type note_resp struct {
	EContent          string `json:"eContent"`
	IsNew             bool   `json:"isNew"`
	CurrentDBVersion  int    `json:"currentDBVersion"`
	ExpectedDBVersion int    `json:"expectedDBVersion"`
}

func get_note(notename string) (*note_resp, error) {
	resp, err := http.Get(fmt.Sprintf(getnoteurl, notename))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)

	fmt.Println(string(body))

	note := &note_resp{}
	err = json.Unmarshal(body, note)
	if err != nil {
		return nil, err
	}
	return note, nil
}

func post_note(notename string, req_note *note_req) error {

	//fmt.Printf("%+v \n", req_note)

	// byte_data, err := json.Marshal(req_note)
	// if err != nil {
	// 	return err
	// }
	// fmt.Printf(string(byte_data))
	// datareader := bytes.NewReader(byte_data)
	// client := &http.Client{}
	// req, err := http.NewRequest("POST", fmt.Sprintf(noteurl, notename), datareader)
	// if err != nil {
	// 	log.Fatalln(err)
	// }
	// req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:69.0) Gecko/20100101 Firefox/69.0")
	// req.Header.Set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
	// req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01'")

	// url.Values{}
	// //fmt.Printf("%+v \n", req)
	// client.PostForm()

	resp, err := http.PostForm(fmt.Sprintf(noteurl, notename),
		url.Values{
			"initHashContent":    {req_note.InitHashContent},
			"currentHashContent": {req_note.CurrentHashContent},
			"encryptedContent":   {req_note.EncryptedContent},
			"action":             {req_note.Action},
		})
	if err != nil {
		log.Fatalln(err)
	}

	//resp, err := http.Post(fmt.Sprintf(noteurl, notename), "application/json", datareader)

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	fmt.Println(string(body))
	// {"status": "success"}
	// {"status": "failed"}
	dmap := map[string]string{}
	err = json.Unmarshal(body, &dmap)
	if err != nil {
		return err
	}
	if dmap["status"] == "success" {
		return nil
	}
	if dmap["status"] == "failed" {
		return ERROR_UPDATE
	}
	return ERROR_UNKNOWN
}
