package crypto

import (
	"strings"

	"github.com/Luzifer/go-openssl"
)

type Encryptor struct {

	// initial state
	siteurl    string
	password   string
	plaintexts []string

	// calculated later
	paddedtext_tabonly   string //needed for calculating validity hash
	paddedtext_tab_n_tag string
	validity_hash        string
	ciperText            string
}

func NewEncryptor(siteurl, password string, plaintexts []string) *Encryptor {
	return &Encryptor{
		plaintexts: plaintexts,
		siteurl:    siteurl,
		password:   password,
	}
}

func (e *Encryptor) Process() error {
	e.padtext()
	ciper, err := e.encrypt()
	if err != nil {
		return err
	}
	e.ciperText = string(ciper)
	e.calculate_validity_hash()
	return nil
}

func (e *Encryptor) padtext() {
	// should use buffer instead
	var stringbuf strings.Builder

	for n, tab_text := range e.plaintexts {

		stringbuf.WriteString(tab_text)
		if n == (len(e.plaintexts) - 1) {
			e.paddedtext_tabonly = stringbuf.String()
			stringbuf.WriteString(sha(e.siteurl))
		} else {
			stringbuf.WriteString(tabSeperator())
		}
	}
	e.paddedtext_tab_n_tag = stringbuf.String()
}

func (e *Encryptor) encrypt() ([]byte, error) {
	o := openssl.New()
	return o.EncryptBytes(e.password, []byte(e.paddedtext_tab_n_tag), openssl.DigestMD5Sum)
}

func (e *Encryptor) calculate_validity_hash() {
	e.validity_hash = validityHash(e.paddedtext_tabonly, e.password)
}
