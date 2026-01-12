import os
import subprocess
import tempfile
import re
from rest_framework.decorators import api_view
from rest_framework.response import Response

# 1. Update arguments to accept 'duration'
def inject_dump_commands(content, module_name, duration=None):
    """
    Injects $dumpfile, scoped $dumpvars, AND a simulation duration limit.
    """
    if "endmodule" in content:
        # Create the simulation control block
        # If duration is provided (e.g., 1000), we add: #1000 $finish;
        timer_code = f"#{duration} $finish;" if duration else ""
        
        injection = f"""
    initial begin
        $dumpfile("dump.vcd");
        $dumpvars(0, {module_name});
        {timer_code}
    end
endmodule
"""
        return content.rsplit("endmodule", 1)[0] + injection
    return content

# ... (Keep parse_vcd_signals as is) ...
def parse_vcd_signals(vcd_path):
    signals = []
    scope_stack = []
    try:
        with open(vcd_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith("$enddefinitions"):
                    break
                parts = line.split()
                if not parts: continue
                if parts[0] == "$scope":
                    scope_stack.append(parts[2])
                elif parts[0] == "$upscope":
                    if scope_stack: scope_stack.pop()
                elif parts[0] == "$var":
                    signal_name = parts[4]
                    full_name = ".".join(scope_stack) + "." + signal_name
                    signals.append(full_name)
    except FileNotFoundError:
        return []
    return signals

@api_view(['POST'])
def run_simulation(request):
    data = request.data
    files = data.get('files', [])
    tb_file_name = data.get('testbench_name') 
    
    # 2. Get duration from request (default to none if missing)
    duration = data.get('duration', None) 

    if not files or not tb_file_name:
        return Response({"success": False, "error": "No files or testbench selected"}, status=400)

    tb_module_name = os.path.splitext(tb_file_name)[0]

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            verilog_file_names = []
            
            for f in files:
                file_path = os.path.join(temp_dir, f['name'])
                content = f['content']
                
                # 3. Pass duration to injection function
                if f['name'] == tb_file_name:
                    content = inject_dump_commands(content, tb_module_name, duration)
                
                with open(file_path, 'w') as fh:
                    fh.write(content)
                
                if f['name'].endswith('.v'):
                    verilog_file_names.append(f['name'])

            # Compile
            compile_cmd = ['iverilog', '-o', 'sim.out'] + verilog_file_names
            compile_proc = subprocess.run(
                compile_cmd, cwd=temp_dir, capture_output=True, text=True
            )

            if compile_proc.returncode != 0:
                return Response({
                    "success": False, 
                    "error": "Compilation Failed:\n" + compile_proc.stderr
                }, status=400)

            # Run
            run_proc = subprocess.run(
                ['vvp', 'sim.out'], cwd=temp_dir, capture_output=True, text=True
            )
            
            # Parse
            vcd_path = os.path.join(temp_dir, "dump.vcd")
            signals = parse_vcd_signals(vcd_path)

            vcd_content = ""
            if os.path.exists(vcd_path):
                with open(vcd_path, 'r') as fh:
                    vcd_content = fh.read()

            return Response({
                "success": True,
                "signals": signals,
                "vcd": vcd_content,
                "logs": run_proc.stdout
            })

        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)