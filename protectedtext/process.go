package protectedtext

import (
	"fmt"

	"github.com/bornjre/crypticnote/crypto"
)

func (p *ProtectedText) process(msg string) {
	p.storagePolicy(msg)
}

func (p *ProtectedText) simple_storage_policy(msg string) {
	// save all in one place
	fmt.Println("<FinalDestination>", msg)
	p.plock.Lock()
	defer p.plock.Unlock()

	p.metaData = append(p.metaData, msg)
	cipertext, hash := crypto.Encrypt(p.metaUrl, p.metaPassword, p.metaData)

	req := &note_req{
		Action:             "save",
		CurrentHashContent: hash,
		EncryptedContent:   cipertext,
		//Firstrun:           false,
		InitHashContent: p.oldmetaHash,
	}

	err := post_note(p.metaUrl, req)
	if err == ERROR_UPDATE {
		p.refresh_state()
	} else if err != nil {
		fmt.Println(err)
	}
	if err == nil {
		p.oldmetaHash = hash
	}
}

func (p *ProtectedText) meta_storage_policy(msg string) {
	// this is better bcz storing on one note make it bigger and bigger everytime
	// and we have to send dublicate data (which keeps on increaseing )
	// every time

	//PROCESS
	// generate UUID
	// derive password from UUID and metapassword
	// push to url /UUID and clipboard/note contents
	// and update metatable
}

func (p *ProtectedText) meta_groupped_storage_policy(msg string) {
	//TODO

}
func (p *ProtectedText) network_error() {}

func (p *ProtectedText) handle_error(data interface{}) {}
