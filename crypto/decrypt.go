package crypto

import (
	"strings"

	"github.com/Luzifer/go-openssl"
)

type Decryptor struct {
	// initial state
	cipertext string
	password  string

	// calculated later
	plaintext_with_seperator []byte
	plaintexts               []string
}

func NewDecryptor(password, cipertext string) *Decryptor {
	return &Decryptor{
		cipertext: cipertext,
		password:  password,
	}
}

func (d *Decryptor) Process() error {
	pt, err := d.decrypt()
	if err != nil {
		return err
	}
	d.plaintext_with_seperator = pt
	d.strip_seperator()

	return nil
}

func (d *Decryptor) decrypt() ([]byte, error) {
	o := openssl.New()
	return o.DecryptBytes(d.password, []byte(d.cipertext), openssl.DigestMD5Sum)
}

func (d *Decryptor) strip_seperator() {

	offset := (len(d.plaintext_with_seperator) - 128)
	text := string(d.plaintext_with_seperator[:offset])

	//fmt.Println("FULL:", string(d.plaintext_with_seperator))
	//fmt.Println("Stripping:", string(d.plaintext_with_seperator[offset:]))

	d.plaintexts = strings.Split(text, tabSeperator())
}
