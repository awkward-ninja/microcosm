.PHONY: serve

serve:
	( sleep 3 && qrencode --type ANSIUTF8 $$( \
		gh codespace ports --codespace $$CODESPACE_NAME --json browseUrl --jq '.[0].browseUrl' \
	) ) &
	python3 -m http.server --directory docs/ 3000
