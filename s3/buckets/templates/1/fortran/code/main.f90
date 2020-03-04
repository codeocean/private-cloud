program hello
	character(len=64) :: arg
	character(len=64) :: data

	narg = command_argument_count()
	if (narg > 0) then
		call get_command_argument(1,arg)
		open(unit=1, file=arg)
		read(1,'(a)') data
		write(*,'(a,a)')"Hello ",data
		close(unit=1)

		open(unit=1, file='../results/result.txt')
		write(1,'(a,a)')"Hello ",data
		close(unit=1)
	end if
end
