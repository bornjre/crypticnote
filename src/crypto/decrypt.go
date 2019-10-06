package crypto

import (
	"strings"

	"github.com/Luzifer/go-openssl"
)

type Decryptor struct {
	cipertext                string
	plaintext_with_seperator []byte
	plaintexts               []string
	ctx                      *CryptoCtx
}

func NewDecryptor(ciper string, ctx *CryptoCtx) *Decryptor {
	return &Decryptor{
		cipertext: ciper,
		ctx:       ctx,
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
	return o.DecryptBytes(d.ctx.Password, []byte(d.cipertext), openssl.DigestMD5Sum)
}

func (d *Decryptor) strip_seperator() {

	offset := (len(d.plaintext_with_seperator) - 128)
	text := string(d.plaintext_with_seperator[:offset])

	d.plaintexts = strings.Split(text, tabSeperator())
}
