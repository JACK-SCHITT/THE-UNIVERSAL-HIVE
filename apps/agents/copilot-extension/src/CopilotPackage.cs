using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using Task = System.Threading.Tasks.Task;
using CopilotExtension.Services;

[PackageRegistration(UseManagedResourcesOnly = true, AllowsBackgroundLoading = true)]
[Guid(CopilotPackage.PackageGuidString)]
public sealed class CopilotPackage : AsyncPackage
{
	public const string PackageGuidString = "d1e7c1b2-0000-4c00-9000-000000000001";

	protected override async Task InitializeAsync(CancellationToken cancellationToken, IProgress<ServiceProgressData> progress)
	{
		await JoinableTaskFactory.SwitchToMainThreadAsync(cancellationToken);

		var service = new SolutionExplorerService();
		var projects = service.GetAllProjects();

		IVsOutputWindow outWindow = (IVsOutputWindow)await GetServiceAsync(typeof(SVsOutputWindow));
		Guid generalPaneGuid = VSConstants.GUID_OutWindowGeneralPane;
		outWindow.GetPane(ref generalPaneGuid, out IVsOutputWindowPane pane);
		pane?.Activate();
		pane?.OutputString("[CopilotExtension] Projects in solution:\n");
		foreach (var project in projects)
		{
			pane?.OutputString("  - " + project + "\n");
		}
	}
}
