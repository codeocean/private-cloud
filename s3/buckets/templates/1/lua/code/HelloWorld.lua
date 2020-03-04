assert(table.getn(arg) > 0)

local fin = assert(io.open(arg[1], "r"))
local data = fin:read("*all")
fin:close()

local result = string.format("Hello %s", data)
print(result)

local fout = assert(io.open("../results/result.txt", "w"))
local data = fout:write(result)
fout:close()
