package crypto

import (
	"testing"
)

var _stub_from_website = map[string]string{
	"initHashContent": "8fb29448faee18b656030e8f5a8b9e9a695900f36a3b7d7ebb0d9d51e06c8569d81a55e39b481cf50546d697e7bde1715aa6badede8ddc801c739777be77f1662", "currentHashContent": "1f10b5cb8ee8eec5d05e4e5507cb5fe1bbdb877a8a6fa0aabf5df145e897b7065ca7ce3543290d0d01589c416ede22e614afb096913223b9afe7fe2e26dc8d172",
	"encryptedContent": "U2FsdGVkX19p2iO3RASMkOVIXrP+50ToGQXhAdcwwzUcnT7qHMEsK3iM573ySuVG03QzwGDMn/93MTf0HVXivnyzLt0R3px9jXon0W45teVhh/FXaxFr62uggU1IK9mjassg6SUYGvsRaOfGF/GRVzsKOGEqYf8jc3wlCaZ+3j/zV8En4AgZiSSKPnx5U7vP/wknfoA6SZ3568TRtYquohqyC/rEvjDft6aPnjwBULrnvFTvex5xvZ3hCrlH7aVXPgPTGt+C7h30eWwKlF7S/+W50DhyZrqa+vh3iu7TvAGABpQid+kcypeTPVsmh8TWJNXSqphxBNMFytlqbqEMrmIF20jeW34zJthIIGzsCP+zj3yxmuYoxUD7/yiZmI243oZH+hyrylXHOyZ/K6TG97Yg+T84MTSsQyK/6XBV3g2kdNZg12jUH8hZLE7cWS1GTQRXMNhNX1IfZaNkRcNvwkgnPUbUs0WmF9AP7/+7du5NF+dPxVFR1e5kn83SR3XYEhatBX9vwO/k0fmvIW87Lxd4YCyiya8p99o9GkMczJXOJmDxDeoHremgZaOCynN6uL5gmpjlvnQ2RUD3imcJyiSLlV0BLuMFP1iFYyfxfv4=",
	"action":           "save",
}

func Test_crypto(t *testing.T) {
	// TODO write test
	ctx := &CryptoCtx{
		Password: "jombotrain",
		Siteurl:  "/jombotrain",
	}

	//t.Logf("SITEURLHASH %+v\n", sha("/jombotrain"))
	//t.Logf("TABSEPERATOR %+v\n", tabSeperator())

	d := NewDecryptor(_stub_from_website["encryptedContent"], ctx)
	d.Process()
	//t.Logf("DECRYPTED_ALL:%+v\n", string(d.plaintext_with_seperator))

	e := NewEncryptor(d.plaintexts, ctx)
	e.Process()
	t.Logf("VALIDITY HASH %+v\n", e.validity_hash)
	//t.Logf("TODOENCRYPT_ALL:%+v\n", e.paddedtext_tab_n_tag)
	//t.Logf("Aftercheck:%+v\n", validityHash(processed, ctx.Password))
	if _stub_from_website["currentHashContent"] != e.validity_hash {
		t.Fatalf("Calculated auth/validity hash incorrect")
	}
}
