package protectedtext

import (
	"fmt"

	"github.com/bornjre/crypticnote/crypto"
)

func (p *ProtectedText) initial_state() {

	// intit initial state
	// figureout if it is first run
	// if so create metatable and stuff
	// otherwise read meta table from server

	//todo
	// if some error the make start netwrk error counter and
	// listen retry channel for retry

	note, err := get_note(p.metaUrl)
	if err != nil {
		fmt.Println(err)
		panic("TODO")
	}

	//p.plock.Lock()
	//defer p.plock.Unlock()

	if note.IsNew {
		p.metaData = make([]string, 0, 100)
		p.oldmetaHash = new_note_initHashContent
	} else {
		p.metaData = crypto.Decrypt(p.metaPassword, note.EContent)
		_, hash := crypto.Encrypt(p.metaUrl, p.metaPassword, p.metaData)
		p.oldmetaHash = hash
	}
	fmt.Println("=>", p.metaData)
}

func (p *ProtectedText) refresh_state() {

	note, err := get_note(p.metaUrl)
	if err != nil {
		fmt.Println(err)
		panic("TODO")
	}

	oldData := crypto.Decrypt(p.metaPassword, note.EContent)
	_, hash := crypto.Encrypt(p.metaUrl, p.metaPassword, oldData)
	p.oldmetaHash = hash

}
