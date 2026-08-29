import string

ALPHABET = string.digits + string.ascii_lowercase + string.ascii_uppercase

def encode(num):
    """Encode integer to base62 string."""
    if num == 0:
        return ALPHABET[0]

    arr = []
    while num:
        num, rem = divmod(num, 62)
        arr.append(ALPHABET[rem])

    arr.reverse()
    return ''.join(arr)

def decode(s):
    """Decode base62 string to integer."""
    if not s:
        raise ValueError("Cannot decode empty string")
    return int(s, 62)
