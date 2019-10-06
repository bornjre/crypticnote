package crypto

import (
	"crypto/sha512"
	"encoding/hex"
)

func tabSeperator() string {
	return sha("-- tab separator --")
}

func validityHash(content, password string) string {
	DBVersion := 2
	pass_sha := sha(password)
	total_sha := sha(content + pass_sha)
	return total_sha + string(DBVersion)
}

func sha(text string) string {
	sha_512 := sha512.New()
	sha_512.Write([]byte(text))
	return hex.EncodeToString(sha_512.Sum(nil))
}
